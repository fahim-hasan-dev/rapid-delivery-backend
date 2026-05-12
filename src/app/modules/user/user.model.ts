import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import { IUser, UserModel } from "./user.interface";
import { USER_STATUS, PROFILE_VERIFICATION_STATUS, USER_ROLES } from "../../../enum/user";
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
            default: USER_STATUS.PENDING,
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
            type: {
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
            select: false
        },
        fcmToken: [{
            type: String,
        }],
        // Information specific to driver accounts (only populated for DRIVER role)
        driverInfo: {
            type: new Schema({
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
                averageRating: { type: Number, default: 0 }
            }, { _id: false }),
            default: undefined
        },
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

        if (this.role !== USER_ROLES.DRIVER) {
            this.driverInfo = undefined;
        }

        next();
    } catch (error) {
        next(error as Error);
    }
});

UserSchema.pre("findOneAndUpdate", async function (next) {
    const update = this.getUpdate() as any;
    const user = await this.model.findOne(this.getQuery());

    if (user && user.role !== USER_ROLES.DRIVER) {
        if (update.$set) {
            delete update.$set.driverInfo;
        } else {
            delete update.driverInfo;
        }
    }
    next();
});

UserSchema.index({ "location": "2dsphere" });

export const User = mongoose.model<IUser, UserModel>("User", UserSchema);
