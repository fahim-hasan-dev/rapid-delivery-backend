import { StatusCodes } from 'http-status-codes'
import { IAuthResponse, IResetPassword } from './auth.interface'
import { User } from '../user/user.model'
import ApiError from '../../../errors/ApiError'
import { USER_ROLES, USER_STATUS } from '../../../enum/user'
import { AuthHelper } from './auth.helper'
import {
  AuthCommonServices,
  authResponse,
} from './common'
import { ILoginData } from '../../../interfaces/auth'
import { emailTemplate } from '../../../shared/emailTemplate'
import { JwtPayload } from 'jsonwebtoken'
import { emailQueue } from '../../../queues'
import { jwtHelper } from '../../../helpers/jwtHelper'
import config from '../../../config'
import bcrypt from 'bcrypt'
import cryptoToken, { generateOtp } from '../../../utils/crypto'
import { Token } from '../token/token.model'
import { IUser } from '../user/user.interface'
import mongoose from 'mongoose'

// Register a new user and initiate email verification
export const createUser = async (payload: IUser) => {
  payload.email = payload.email?.toLowerCase().trim()
  const session = await mongoose.startSession()

  try {
    session.startTransaction()

    // Prevent direct creation of super admin accounts via this endpoint
    if (payload.role === USER_ROLES.SUPER_ADMIN) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Super Admin account creation is not allowed.`,
      )
    }

    const isUserExist = await User.findOne({
      email: payload.email,
      status: { $nin: [USER_STATUS.DELETED] },
    }).session(session)

    if (isUserExist) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `An account with this email already exists.`,
      )
    }

    const otp = generateOtp()
    const otpExpiresIn = new Date(Date.now() + 5 * 60 * 1000)

    // Set initial authentication state with pending verification
    const authentication = {
      oneTimeCode: otp,
      expiresAt: otpExpiresIn,
      latestRequestAt: new Date(),
      requestCount: 1,
      authType: 'createAccount' as const,
      restrictionLeftAt: null,
      resetPassword: false,
      wrongLoginAttempts: 0,
    }

    // Send the verification email via queue
    const createAccountEmail = emailTemplate.createAccount({
      name: payload.fullName || 'User',
      email: payload.email,
      otp,
    })
    const user = await User.create(
      [
        {
          ...payload,
          authentication,
          role: payload.role || USER_ROLES.SENDER,
          driverInfo: payload.role === USER_ROLES.DRIVER ? {} : undefined,
        },
      ],
      { session },
    )

    if (!user[0])
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create user.')

    await session.commitTransaction()
    session.endSession()

    // Send the verification email via queue AFTER successful transaction
    await emailQueue.add('send-email', createAccountEmail)

    return user[0]._id
  } catch (error) {
    await session.abortTransaction()
    session.endSession()
    throw error
  }
}

// Authenticate a standard user via email or phone
const login = async (payload: ILoginData): Promise<IAuthResponse> => {
  const { email, phone } = payload
  const query = email ? { email: email.toLowerCase().trim() } : { phone: phone }

  const isUserExist = await User.findOne({
    ...query,
    status: { $in: [USER_STATUS.ACTIVE, USER_STATUS.RESTRICTED] },
  })
    .select('+password +authentication')
    .lean()

  if (!isUserExist) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `No account found with this ${email ? 'email' : 'phone'}`,
    )
  }

  return await AuthCommonServices.handleLoginLogic(payload, isUserExist)
}

// Specialized login for administrative roles
const adminLogin = async (payload: ILoginData): Promise<IAuthResponse> => {
  const { email, phone } = payload
  const query = email ? { email: email.trim().toLowerCase() } : { phone: phone }

  const isUserExist = await User.findOne({
    ...query,
  })
    .select('+password +authentication')
    .lean()

  if (!isUserExist) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `No account found with this ${email ? 'email' : 'phone'}`,
    )
  }

  // Ensure the user has administrative privileges
  if (isUserExist.role !== USER_ROLES.ADMIN && isUserExist.role !== USER_ROLES.SUPER_ADMIN) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You are not authorized to login as admin',
    )
  }

  const isPasswordMatch = await AuthHelper.isPasswordMatched(
    payload.password,
    isUserExist.password as string,
  )

  if (!isPasswordMatch) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      'Please try again with correct credentials.',
    )
  }

  const tokens = AuthHelper.createToken(
    isUserExist._id,
    isUserExist.role,
    isUserExist.fullName || 'Admin',
    isUserExist.email,
  )

  return authResponse(
    StatusCodes.OK,
    `Welcome back ${isUserExist.fullName || 'Admin'}`,
    isUserExist.role,
    tokens.accessToken,
    tokens.refreshToken,
  )
}

// Initiate password recovery by sending an OTP
const forgetPassword = async (email?: string, phone?: string) => {
  const query = email
    ? { email: email.toLocaleLowerCase().trim() }
    : { phone: phone }
  const isUserExist = await User.findOne({
    ...query,
    status: { $in: [USER_STATUS.ACTIVE, USER_STATUS.RESTRICTED] },
  })

  if (!isUserExist) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'No account found with this email or phone',
    )
  }

  const otp = generateOtp()

  const authentication = {
    resetPassword: true,
    oneTimeCode: otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    latestRequestAt: new Date(),
    requestCount: 1,
    authType: 'resetPassword' as const,
    restrictionLeftAt: null,
    wrongLoginAttempts: 0,
  }

  await User.findByIdAndUpdate(
    isUserExist._id,
    {
      $set: { authentication: authentication },
    },
    { new: true },
  )

  if (email) {
    const forgetPasswordEmailTemplate = emailTemplate.resetPassword({
      name: isUserExist.fullName || 'User',
      email: isUserExist.email,
      otp,
    })

    await emailQueue.add('send-email', forgetPasswordEmailTemplate)
  }

  return 'OTP sent successfully.'
}

// Update password using a temporary reset token
const resetPassword = async (resetToken: string, payload: IResetPassword) => {
  const { newPassword, confirmPassword } = payload
  if (newPassword !== confirmPassword) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Passwords do not match')
  }

  const isTokenExist = await Token.findOne({ token: resetToken }).lean()

  if (!isTokenExist) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "You don't have authorization to reset your password, please verify your account first.",
    )
  }

  const isUserExist = await User.findById(isTokenExist.user)
    .select('+authentication')
    .lean()

  if (!isUserExist) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Requested user not found, please try again or contact support.',
    )
  }

  const { authentication } = isUserExist
  if (!authentication?.resetPassword) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You don\'t have permission to change the password. Please click again to "Forgot Password"',
    )
  }

  const isTokenValid = isTokenExist?.expireAt > new Date()
  if (!isTokenValid) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Your reset token has expired, please try again.',
    )
  }

  const hashPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds),
  )

  const updatedUserData = {
    password: hashPassword,
    authentication: {
      resetPassword: false,
      oneTimeCode: '',
      expiresAt: null,
      latestRequestAt: new Date(),
      requestCount: 0,
      restrictionLeftAt: null,
      wrongLoginAttempts: 0,
    },
  }

  await User.findByIdAndUpdate(
    isUserExist._id,
    { $set: updatedUserData },
    { new: true },
  )

  return { message: 'Password reset successfully' }
}

// Verify account using OTP for registration or password reset
const verifyAccount = async (
  email: string,
  onetimeCode: string,
): Promise<IAuthResponse> => {
  if (!onetimeCode) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'OTP is required.')
  }
  const isUserExist = await User.findOne({
    email: email.toLowerCase().trim(),
    status: { $nin: [USER_STATUS.DELETED] },
  })
    .select('+password +authentication')
    .lean()

  if (!isUserExist) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `No account found with this ${email}, please register first.`,
    )
  }

  const { authentication } = isUserExist

  if (authentication?.oneTimeCode !== onetimeCode) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Invalid OTP, please try again.',
    )
  }

  const currentDate = new Date()
  if (authentication?.expiresAt! < currentDate) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'OTP has expired, please try again.',
    )
  }

  // Handle initial account verification
  if (!isUserExist.isEmailVerified) {
    await User.findByIdAndUpdate(
      isUserExist._id,
      { $set: { isEmailVerified: true } },
      { new: true },
    )

    const tokens = AuthHelper.createToken(
      isUserExist._id,
      isUserExist.role,
      isUserExist.fullName || 'User',
      isUserExist.email,
    )
    const userInfo = {
      id: isUserExist._id,
      role: isUserExist.role,
      name: isUserExist.fullName || 'User',
      email: isUserExist.email!,
      image: isUserExist.image!,
    }

    return authResponse(
      StatusCodes.OK,
      `Welcome ${isUserExist.fullName || 'User'} to our platform.`,
      undefined,
      tokens.accessToken,
      tokens.refreshToken,
      undefined,
      userInfo,
    )
  } else {
    // Handle OTP verification for password reset
    await User.findByIdAndUpdate(
      isUserExist._id,
      {
        $set: {
          authentication: {
            oneTimeCode: '',
            expiresAt: null,
            latestRequestAt: null,
            requestCount: 0,
            authType: '',
            resetPassword: true,
          },
        },
      },
      { new: true },
    )

    const token = await Token.create({
      token: cryptoToken(),
      user: isUserExist._id,
      expireAt: new Date(Date.now() + 5 * 60 * 1000),
    })

    if (!token) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        ' please try again. or contact support.',
      )
    }

    return authResponse(
      StatusCodes.OK,
      'OTP verified successfully, please reset your password.',
      undefined,
      undefined,
      undefined,
      token.token,
    )
  }
}

// Generate new access token using a valid refresh token
const getAccessToken = async (token: string) => {
  if (!token) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh Token is required')
  }

  try {
    const decodedToken = jwtHelper.verifyToken(
      token,
      config.jwt.jwt_refresh_secret as string,
    )

    const { authId, role } = decodedToken

    const tokens = AuthHelper.createToken(
      authId,
      role,
      decodedToken.name,
      decodedToken.email,
    )

    return {
      accessToken: tokens.accessToken,
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh Token has expired')
    }
    throw new ApiError(StatusCodes.FORBIDDEN, 'Invalid Refresh Token')
  }
}

// Core logic for re-sending OTP via email or phone
const resendOtpToPhoneOrEmail = async (
  authType: 'resetPassword' | 'createAccount',
  email?: string,
  phone?: string,
) => {
  const query = email ? { email: email } : { phone: phone }
  const isUserExist = await User.findOne({
    ...query,
    status: { $in: [USER_STATUS.ACTIVE, USER_STATUS.RESTRICTED] },
  }).select('+authentication')

  if (!isUserExist) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `No account found with this ${email ? 'email' : 'phone'}`,
    )
  }

  const { authentication } = isUserExist
  if (authentication?.requestCount! >= 5) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You have exceeded the maximum number of requests. Please try again later.',
    )
  }

  const otp = generateOtp()
  const updatedAuthentication = {
    ...authentication,
    oneTimeCode: otp,
    latestRequestAt: new Date(),
    requestCount: authentication?.requestCount! + 1,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    authType: authType,
  }

  if (email) {
    const forgetPasswordEmailTemplate = emailTemplate.resendOtp({
      email: isUserExist.email,
      name: isUserExist.fullName || 'User',
      otp,
      type: authType,
    })

    await User.findByIdAndUpdate(
      isUserExist._id,
      {
        $set: { authentication: updatedAuthentication },
      },
      { new: true },
    )

    await emailQueue.add('send-email', forgetPasswordEmailTemplate)
  }

  if (phone) {
    await User.findByIdAndUpdate(
      isUserExist._id,
      {
        $set: { authentication: updatedAuthentication },
      },
      { new: true },
    )
  }
}

// Handle secure account deletion with password verification
const deleteAccount = async (user: JwtPayload, password: string) => {
  const { authId } = user
  const isUserExist = await User.findById(authId).select('+password')

  if (!isUserExist) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Failed to delete account. Please try again.',
    )
  }

  if (isUserExist.status === USER_STATUS.DELETED) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Requested user is already deleted.',
    )
  }

  const isPasswordMatched = await bcrypt.compare(password, isUserExist.password)

  if (!isPasswordMatched) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Please provide a valid password to delete your account.',
    )
  }

  const deletedData = await User.findByIdAndUpdate(authId, {
    $set: { status: USER_STATUS.DELETED },
  })

  return {
    status: StatusCodes.OK,
    message: 'Account deleted successfully.',
    deletedData,
  }
}

// Specialized OTP resend for specific web flows
const resendOtp = async (
  email: string,
  authType: 'createAccount' | 'resetPassword',
) => {
  const isUserExist = await User.findOne({
    email: email.toLowerCase().trim(),
    status: { $in: [USER_STATUS.ACTIVE, USER_STATUS.RESTRICTED] },
  }).select('+authentication')

  if (!isUserExist) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `No account found with this ${email}, please try again.`,
    )
  }

  const { authentication } = isUserExist

  const otp = generateOtp()
  const authenticationPayload = {
    ...authentication,
    oneTimeCode: otp,
    latestRequestAt: new Date(),
    requestCount: authentication?.requestCount! + 1,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  }

  if (authenticationPayload.requestCount! >= 5) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You have exceeded the maximum number of requests. Please try again later.',
    )
  }

  await User.findByIdAndUpdate(
    isUserExist._id,
    {
      $set: { authentication: authenticationPayload },
    },
    { new: true },
  )

  if (email) {
    const forgetPasswordEmailTemplate = emailTemplate.resendOtp({
      email: email,
      name: isUserExist.fullName || 'User',
      otp,
      type: authType,
    })

    await emailQueue.add('send-email', forgetPasswordEmailTemplate)
  }

  return 'OTP sent successfully.'
}

// Update the user's password securely
const changePassword = async (
  user: JwtPayload,
  currentPassword: string,
  newPassword: string,
) => {
  const isUserExist = await User.findById(user.authId)
    .select('+password')
    .lean()

  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
  }

  const isPasswordMatch = await AuthHelper.isPasswordMatched(
    currentPassword,
    isUserExist.password as string,
  )

  if (!isPasswordMatch) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Current password is incorrect')
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds),
  )

  await User.findByIdAndUpdate(
    user.authId,
    { password: hashedPassword },
    { new: true },
  )

}

// Specialized creation of administrative accounts by Super Admin
const createAdmin = async (payload: IUser) => {
  const isUserExist = await User.findOne({
    email: payload.email.toLowerCase().trim(),
    status: { $nin: [USER_STATUS.DELETED] },
  });

  if (isUserExist) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `An account with this email already exists.`,
    );
  }


  const adminData = {
    ...payload,
    role: USER_ROLES.ADMIN,
    isEmailVerified: true,
  };

  const result = await User.create(adminData);
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create admin account.');
  }

  return result;
}

export const AuthServices = {
  forgetPassword,
  resetPassword,
  verifyAccount,
  login,
  getAccessToken,
  resendOtpToPhoneOrEmail,
  deleteAccount,
  resendOtp,
  changePassword,
  createUser,
  adminLogin,
  createAdmin
}


