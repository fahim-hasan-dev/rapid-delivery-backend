import { z } from "zod";
import { USER_ROLES, USER_STATUS } from "../../../enum/user";

const coordinateSchema = z.array(z.number())
    .length(2)
    .refine((coords) => {
        const [lng, lat] = coords;
        return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
    }, {
        message: "Invalid coordinates. Format must be [longitude, latitude]. Longitude must be between -180 and 180, and Latitude must be between -90 and 90."
    });



export const userSignupSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address").toLowerCase().trim(),
    fullName: z.string().min(1, "Full name is required"),
    phone: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.nativeEnum(USER_ROLES).default(USER_ROLES.SENDER),
  })
});

export const userLoginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address").toLowerCase().trim().optional(),
    phone: z.string().optional(),
    password: z.string().min(1, "Password is required"),
  })
}).refine(data => data.body.email || data.body.phone, {
  message: "Either email or phone is required",
  path: ["body"]
});

export const userUpdateSchema = z.object({
  body: z.object({
    fullName: z.string().optional(),
    phone: z.string().optional(),
    image: z.string().optional(),
    status: z.nativeEnum(USER_STATUS).optional(),
    isEmailVerified: z.boolean().optional(),
    address: z.string().optional(),
    location: coordinateSchema.optional(),
    fcmToken: z.array(z.string()).optional(),
    nid: z.array(z.string()).optional(),
    drivingLicense: z.array(z.string()).optional(),
    dateOfBirth: z.string().optional(),
  })
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
  })
});

export const UserValidations = {
  userSignupSchema,
  userLoginSchema,
  userUpdateSchema,
  changePasswordSchema,
};
