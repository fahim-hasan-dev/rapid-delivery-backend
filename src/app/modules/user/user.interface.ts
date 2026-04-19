import { Model, Types } from "mongoose";
import { USER_ROLES, USER_STATUS } from "../../../enum/user";

export { USER_ROLES, USER_STATUS };

// Authentication details for security and account management
type IAuthentication = {
    restrictionLeftAt: Date | null
    resetPassword: boolean
    wrongLoginAttempts: number
    passwordChangedAt?: Date
    oneTimeCode: string
    latestRequestAt: Date
    expiresAt?: Date
    requestCount?: number
    authType?: 'createAccount' | 'resetPassword'
}

// Main user structure for the rapid-delivery platform
export type IUser = {
    _id: Types.ObjectId;
    fullName?: string;
    email: string;
    phone?: string;
    image?: string;
    password: string;
    status: USER_STATUS;
    role: USER_ROLES;
    address?: string;
    location?: {
        latitude: number;
        longitude: number;
    }
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    authentication: IAuthentication;
    fcmToken?: string[];
    // Information specifically for drivers including documents and ratings
    driverInfo?: {
        nid: string[];
        drivingLicense: string[];
        isVerified: boolean;
        totalRating: number;
        averageRating: number;
        totalDelivery: number;
        totalEarnings: number;
        todayEarnings: number;
    }
};

// Model type for mongoose with static methods
export type UserModel = {
    isPasswordMatched: (givenPassword: string, savedPassword: string) => Promise<boolean>;
} & Model<IUser>;

