import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import { IUser, UserModel } from "./user.interface";
import { USER_STATUS, PROFILE_VERIFICATION_STATUS } from "../../../enum/user";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";
import config from "../../../config";

// Main schema defining the structure of all user accounts in the system
const UserSchema = new Schema(
    {
        fullName: {
            type: String,
            default: "",
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        phone: {
            type: String,
            default: "",
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        image: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: Object.values(USER_STATUS),
            default: USER_STATUS.ACTIVE,
        },
        role: {
            type: String,
            required: true
        },
        address: {
            type: String,
            default: "",
        },
        // Geographical coordinates for delivery tracking
        location: {
            type: [Number],
            default: [0, 0]
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        // Authentication state for security and multi-factor flows
        authentication: {
            restrictionLeftAt: {
                type: Date,
                default: null,
            },
            resetPassword: {
                type: Boolean,
                default: false,
            },
            wrongLoginAttempts: {
                type: Number,
                default: 0,
            },
            passwordChangedAt: Date,
            oneTimeCode: {
                type: String,
                default: "",
            },
            latestRequestAt: {
                type: Date,
                default: Date.now,
            },
            expiresAt: Date,
            requestCount: {
                type: Number,
                default: 0,
            },
            authType: {
                type: String,
                enum: ['createAccount', 'resetPassword'],
            },
        },
        fcmToken: [{
            type: String,
        }],
        // Information specific to driver accounts
        driverInfo: {
            nid: [{ type: String }],
            drivingLicense: [{ type: String }],
            profileVerification: {
                type: String,
                enum: Object.values(PROFILE_VERIFICATION_STATUS),
                default: PROFILE_VERIFICATION_STATUS.PENDING,
            },
            rejectReason: {
                type: String,
                default: ""
            },
            assignedVehicle: {
                type: Schema.Types.ObjectId,
                ref: "Vehicle",
                default: null
            },
            totalRating: { type: Number, default: 0 },
            averageRating: { type: Number, default: 0 },
            totalDelivery: { type: Number, default: 0 },
            totalEarnings: { type: Number, default: 0 },
            todayEarnings: { type: Number, default: 0 },
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Helper method to verify passwords during login
UserSchema.statics.isPasswordMatched = async function (
    givenPassword: string,
    savedPassword: string
) {
    return bcrypt.compare(givenPassword, savedPassword);
};

// Handle password hashing and unique email validation before persistence
UserSchema.pre("save", async function (next) {
    try {
        if (this.isModified("email")) {
            const isExist = await mongoose.models.User.findOne({
                email: this.email,
                status: { $in: [USER_STATUS.ACTIVE, USER_STATUS.RESTRICTED] },
                _id: { $ne: this._id },
            });

            if (isExist) {
                return next(
                    new ApiError(
                        StatusCodes.BAD_REQUEST,
                        "An account with this email already exists"
                    )
                );
            }
        }
        if (this.isModified("password")) {
            this.password = await bcrypt.hash(
                this.password,
                Number(config.bcrypt_salt_rounds)
            );
        }

        next();
    } catch (error) {
        next(error as Error);
    }
});

export const User = mongoose.model<IUser, UserModel>("User", UserSchema);
