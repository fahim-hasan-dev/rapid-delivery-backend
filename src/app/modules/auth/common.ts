import { StatusCodes } from 'http-status-codes'
import { ILoginData } from '../../../interfaces/auth'
import ApiError from '../../../errors/ApiError'
import { USER_STATUS } from '../../../enum/user'
import { User } from '../user/user.model'
import { AuthHelper } from './auth.helper'
import { generateOtp } from '../../../utils/crypto'
import { IAuthResponse } from './auth.interface'
import { emailTemplate } from '../../../shared/emailTemplate'
import { emailQueue } from '../../../queues'

const handleLoginLogic = async (payload: ILoginData, isUserExist: any): Promise<IAuthResponse> => {
    const { authentication, isEmailVerified, status, password } = isUserExist
    const { restrictionLeftAt } = authentication

    if (!isEmailVerified) {
        const otp = generateOtp()
        const otpExpiresIn = new Date(Date.now() + 5 * 60 * 1000)

        await User.findByIdAndUpdate(isUserExist._id, {
            $set: {
                'authentication.oneTimeCode': otp,
                'authentication.expiresAt': otpExpiresIn,
                'authentication.authType': 'createAccount',
            },
        })

        const otpTemplate = emailTemplate.createAccount({
            name: isUserExist.fullName || 'User',
            email: isUserExist.email!,
            otp,
        })
        await emailQueue.add('send-email', otpTemplate)
        return authResponse(StatusCodes.PROXY_AUTHENTICATION_REQUIRED, `An OTP has been sent to your ${isUserExist.email}. Please verify.`)
    }

    if (status === USER_STATUS.DELETED) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'No account found with this email')
    }

    if (status === USER_STATUS.RESTRICTED) {
        if (restrictionLeftAt && new Date() < restrictionLeftAt) {
            const remainingMinutes = Math.ceil((restrictionLeftAt.getTime() - Date.now()) / 60000)
            throw new ApiError(StatusCodes.TOO_MANY_REQUESTS, `You are restricted to login for ${remainingMinutes} minutes`)
        }

        await User.findByIdAndUpdate(isUserExist._id, {
            $set: {
                'authentication.restrictionLeftAt': null,
                'authentication.wrongLoginAttempts': 0,
                status: USER_STATUS.ACTIVE,
            },
        })
    }

    const isPasswordMatched = await User.isPasswordMatched(payload.password, password)

    if (!isPasswordMatched) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Incorrect password, please try again.')
    }

    const updateData: any = {
        $set: {
            'authentication.restrictionLeftAt': null,
            'authentication.wrongLoginAttempts': 0,
        }
    }

    if (payload.fcmToken) {
        updateData.$addToSet = { fcmToken: payload.fcmToken }
    }

    await User.findByIdAndUpdate(isUserExist._id, updateData, { new: true })

    const tokens = AuthHelper.createToken(isUserExist._id, isUserExist.role, isUserExist.fullName, isUserExist.email)
    const userInfo = {
        id: isUserExist._id,
        role: isUserExist.role,
        name: isUserExist.fullName || 'User',
        email: isUserExist.email!,
        image: isUserExist.image!,
    }

    return authResponse(
        StatusCodes.OK,
        `Welcome back ${isUserExist.fullName || 'User'}`,
        undefined,
        tokens.accessToken,
        tokens.refreshToken,
        undefined,
        userInfo
    )
}

export const AuthCommonServices = {
    handleLoginLogic,
}

export const authResponse = (
    status: number,
    message: string,
    role?: string,
    accessToken?: string,
    refreshToken?: string,
    token?: string,
    userInfo?: IAuthResponse['userInfo'],
): IAuthResponse => {
    return {
        status,
        message,
        ...(role && { role }),
        ...(accessToken && { accessToken }),
        ...(refreshToken && { refreshToken }),
        ...(token && { token }),
        ...(userInfo && { userInfo }),
    }
}

