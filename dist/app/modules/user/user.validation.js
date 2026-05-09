"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserValidations = exports.changePasswordSchema = exports.userUpdateSchema = exports.userLoginSchema = exports.userSignupSchema = void 0;
const zod_1 = require("zod");
const user_1 = require("../../../enum/user");
exports.userSignupSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email("Invalid email address").toLowerCase().trim(),
        fullName: zod_1.z.string().min(1, "Full name is required"),
        phone: zod_1.z.string().optional(),
        password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
        role: zod_1.z.nativeEnum(user_1.USER_ROLES).default(user_1.USER_ROLES.SENDER),
    })
});
exports.userLoginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email("Invalid email address").toLowerCase().trim().optional(),
        phone: zod_1.z.string().optional(),
        password: zod_1.z.string().min(1, "Password is required"),
    })
}).refine(data => data.body.email || data.body.phone, {
    message: "Either email or phone is required",
    path: ["body"]
});
exports.userUpdateSchema = zod_1.z.object({
    body: zod_1.z.object({
        fullName: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        image: zod_1.z.string().optional(),
        status: zod_1.z.nativeEnum(user_1.USER_STATUS).optional(),
        isEmailVerified: zod_1.z.boolean().optional(),
        address: zod_1.z.string().optional(),
        location: zod_1.z.array(zod_1.z.number()).length(2).optional(),
        fcmToken: zod_1.z.array(zod_1.z.string()).optional(),
    })
});
exports.changePasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        currentPassword: zod_1.z.string().min(1, "Current password is required"),
        newPassword: zod_1.z.string().min(6, "New password must be at least 6 characters"),
    })
});
exports.UserValidations = {
    userSignupSchema: exports.userSignupSchema,
    userLoginSchema: exports.userLoginSchema,
    userUpdateSchema: exports.userUpdateSchema,
    changePasswordSchema: exports.changePasswordSchema,
};
