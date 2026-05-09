"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthValidations = void 0;
const zod_1 = require("zod");
const user_1 = require("../../../enum/user");
const verifyEmailOrPhoneOtpZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        oneTimeCode: zod_1.z.string().min(1, { message: 'OTP is required' }),
    }),
});
const forgetPasswordZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
    }),
});
const resetPasswordZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        newPassword: zod_1.z.string().min(6, { message: 'Password is required' }),
        confirmPassword: zod_1.z.string().min(6, { message: 'Confirm Password is required' }),
    }),
});
const loginZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        fcmToken: zod_1.z.string().optional(),
        password: zod_1.z.string({ message: 'Credentials are required' }).min(6, { message: 'Invalid Credentials' }),
    }),
});
const verifyAccountZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string(),
        phone: zod_1.z.string().optional(),
        oneTimeCode: zod_1.z.string().min(1, { message: 'OTP is required' }),
    }),
});
const resendOtpZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        authType: zod_1.z.enum(['resetPassword', 'createAccount'])
    }),
});
const changePasswordZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        currentPassword: zod_1.z.string({ required_error: 'Current password is required' }),
        newPassword: zod_1.z.string({ required_error: 'New password is required' }).min(8, 'Password must be at least 8 characters'),
        confirmPassword: zod_1.z.string({ required_error: 'Confirm password is required' }),
    }).refine(data => data.newPassword === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    }),
});
const deleteAccount = zod_1.z.object({
    body: zod_1.z.object({
        password: zod_1.z.string({ required_error: 'Password is required' })
    })
});
const createUserZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string({ required_error: 'Email is required' }).email(),
        password: zod_1.z.string({ required_error: 'Password is required' }).min(6),
        fullName: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        role: zod_1.z.nativeEnum(user_1.USER_ROLES).optional(),
    }),
});
exports.AuthValidations = {
    verifyEmailOrPhoneOtpZodSchema,
    forgetPasswordZodSchema,
    resetPasswordZodSchema,
    loginZodSchema,
    verifyAccountZodSchema,
    resendOtpZodSchema,
    changePasswordZodSchema,
    createUserZodSchema,
    deleteAccount,
};
