"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const user_1 = require("../../../enum/user");
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const config_1 = __importDefault(require("../../../config"));
// Main schema defining the structure of all user accounts in the system
const UserSchema = new mongoose_1.Schema({
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
        enum: Object.values(user_1.USER_STATUS),
        default: user_1.USER_STATUS.ACTIVE,
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
    // Information specific to driver accounts (only populated for DRIVER role)
    driverInfo: {
        type: new mongoose_1.Schema({
            nid: [{ type: String }],
            drivingLicense: [{ type: String }],
            profileVerification: {
                type: String,
                enum: Object.values(user_1.PROFILE_VERIFICATION_STATUS),
                default: user_1.PROFILE_VERIFICATION_STATUS.PENDING,
            },
            rejectReason: {
                type: String,
                default: ""
            },
            assignedVehicle: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "Vehicle",
                default: null
            },
            totalRating: { type: Number, default: 0 },
            averageRating: { type: Number, default: 0 },
            totalDelivery: { type: Number, default: 0 },
            totalEarnings: { type: Number, default: 0 },
            todayEarnings: { type: Number, default: 0 },
        }, { _id: false }),
        default: undefined
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Helper method to verify passwords during login
UserSchema.statics.isPasswordMatched = async function (givenPassword, savedPassword) {
    return bcrypt_1.default.compare(givenPassword, savedPassword);
};
// Handle password hashing and unique email validation before persistence
UserSchema.pre("save", async function (next) {
    try {
        if (this.isModified("email")) {
            const isExist = await mongoose_1.default.models.User.findOne({
                email: this.email,
                status: { $in: [user_1.USER_STATUS.ACTIVE, user_1.USER_STATUS.RESTRICTED] },
                _id: { $ne: this._id },
            });
            if (isExist) {
                return next(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "An account with this email already exists"));
            }
        }
        if (this.isModified("password")) {
            this.password = await bcrypt_1.default.hash(this.password, Number(config_1.default.bcrypt_salt_rounds));
        }
        if (this.role !== user_1.USER_ROLES.DRIVER) {
            this.driverInfo = undefined;
        }
        next();
    }
    catch (error) {
        next(error);
    }
});
UserSchema.pre("findOneAndUpdate", async function (next) {
    const update = this.getUpdate();
    const user = await this.model.findOne(this.getQuery());
    if (user && user.role !== user_1.USER_ROLES.DRIVER) {
        if (update.$set) {
            delete update.$set.driverInfo;
        }
        else {
            delete update.driverInfo;
        }
    }
    next();
});
exports.User = mongoose_1.default.model("User", UserSchema);
