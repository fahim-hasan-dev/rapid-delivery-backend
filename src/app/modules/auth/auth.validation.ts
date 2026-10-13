import { z } from 'zod'
import { USER_ROLES } from '../../../enum/user'

const verifyEmailOrPhoneOtpZodSchema = z.object({
  body: z.object({
    email: z.string().optional(),
    phone: z.string().optional(),
    oneTimeCode: z.string().min(1, { message: 'OTP is required' }),
  }),
})

const forgetPasswordZodSchema = z.object({
  body: z.object({
    email: z.string().optional(),
    phone: z.string().optional(),
  }),
})

const resetPasswordZodSchema = z.object({
  body: z.object({
    newPassword: z.string().min(6, { message: 'Password is required' }),
    confirmPassword: z.string().min(6, { message: 'Confirm Password is required' }),
  }),
})

const loginZodSchema = z.object({
  body: z.object({
    email: z.string().optional(),
    phone: z.string().optional(),
    fcmToken: z.string().optional(),
    password: z.string({ message: 'Credentials are required' }).min(6, { message: 'Invalid Credentials' }),
  }),
})

const verifyAccountZodSchema = z.object({
  body: z.object({
    email: z.string(),
    phone: z.string().optional(),
    oneTimeCode: z.string().min(1, { message: 'OTP is required' }),
  }),
})

const resendOtpZodSchema = z.object({
  body: z.object({
    email: z.string().optional(),
    phone: z.string().optional(),
    authType: z.enum(['resetPassword', 'createAccount'])
  }),
})

const changePasswordZodSchema = z.object({
  body: z.object({
    currentPassword: z.string({ required_error: 'Current password is required' }),
    newPassword: z.string({ required_error: 'New password is required' }).min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string({ required_error: 'Confirm password is required' }),
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
})

const deleteAccount = z.object({
  body: z.object({
    password: z.string({ required_error: 'Password is required' })
  })
})

const createUserZodSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email(),
    password: z.string({ required_error: 'Password is required' }).min(6),
    fullName: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    role: z.nativeEnum(USER_ROLES).optional(),
  }),
})

const fcmTokenZodSchema = z.object({
  body: z.object({
    fcmToken: z.string({ required_error: 'FCM token is required' }),
  }),
})

const socialLoginZodSchema = z.object({
  body: z.object({
    idToken: z.string({ required_error: 'ID Token is required' }),
    role: z.enum([USER_ROLES.SENDER, USER_ROLES.DRIVER]).optional(),
    fcmToken: z.string().optional(),
  }),
})

const selectRoleZodSchema = z.object({
  body: z.object({
    role: z.enum([USER_ROLES.SENDER, USER_ROLES.DRIVER], {
      required_error: 'Role is required and must be sender or driver',
    }),
  }),
})

export const AuthValidations = {
  verifyEmailOrPhoneOtpZodSchema,
  forgetPasswordZodSchema,
  resetPasswordZodSchema,
  loginZodSchema,
  verifyAccountZodSchema,
  resendOtpZodSchema,
  changePasswordZodSchema,
  createUserZodSchema,
  deleteAccount,
  fcmTokenZodSchema,
  socialLoginZodSchema,
  selectRoleZodSchema,
}

