import { Model, Types } from 'mongoose';
import { USER_ROLES } from '../../../enum/user';

export enum USER_STATUS {
    ACTIVE = 'active',
    RESTRICTED = 'restricted',
}

export enum PROFILE_VERIFICATION_STATUS {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    RESUBMITTED = 'resubmitted',
}

export interface IAuthentication {
    restrictionLeftAt: Date | null
    resetPassword: boolean
    wrongLoginAttempts: number
    passwordChangedAt?: Date
    oneTimeCode: string | null
    latestRequestAt: Date
    expiresAt?: Date
    requestCount?: number
    authType?: 'createAccount' | 'resetPassword'
}

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
    location?: [number, number];
    isEmailVerified: boolean;
    authentication: IAuthentication;
    fcmToken?: string[];
    driverInfo?: {
        nid: string[];
        drivingLicense: string[];
        profileVerification: PROFILE_VERIFICATION_STATUS;
        rejectReason?: string;
        assignedVehicle?: Types.ObjectId;
        totalRating: number;
        averageRating: number;
        totalDelivery: number;
        totalEarnings: number;
        todayEarnings: number;
    }
};

export type UserModel = {
    isPasswordMatched: (givenPassword: string, savedPassword: string) => Promise<boolean>;
} & Model<IUser>;
