"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authResponse = exports.AuthCommonServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const user_1 = require("../../../enum/user");
const user_model_1 = require("../user/user.model");
const auth_helper_1 = require("./auth.helper");
const crypto_1 = require("../../../utils/crypto");
const emailTemplate_1 = require("../../../shared/emailTemplate");
const queues_1 = require("../../../queues");
const handleLoginLogic = async (payload, isUserExist) => {
    const { authentication, isEmailVerified, status, password } = isUserExist;
    const { restrictionLeftAt } = authentication;
    if (!isEmailVerified) {
        const otp = (0, crypto_1.generateOtp)();
        const otpExpiresIn = new Date(Date.now() + 5 * 60 * 1000);
        await user_model_1.User.findByIdAndUpdate(isUserExist._id, {
            $set: {
                'authentication.oneTimeCode': otp,
                'authentication.expiresAt': otpExpiresIn,
                'authentication.authType': 'createAccount',
            },
        });
        const otpTemplate = emailTemplate_1.emailTemplate.createAccount({
            name: isUserExist.fullName || 'User',
            email: isUserExist.email,
            otp,
        });
        await queues_1.emailQueue.add('send-email', otpTemplate);
        return (0, exports.authResponse)(http_status_codes_1.StatusCodes.PROXY_AUTHENTICATION_REQUIRED, `An OTP has been sent to your ${isUserExist.email}. Please verify.`);
    }
    if (status === user_1.USER_STATUS.DELETED) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'No account found with this email');
    }
    if (status === user_1.USER_STATUS.RESTRICTED) {
        if (restrictionLeftAt && new Date() < restrictionLeftAt) {
            const remainingMinutes = Math.ceil((restrictionLeftAt.getTime() - Date.now()) / 60000);
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.TOO_MANY_REQUESTS, `You are restricted to login for ${remainingMinutes} minutes`);
        }
        await user_model_1.User.findByIdAndUpdate(isUserExist._id, {
            $set: {
                'authentication.restrictionLeftAt': null,
                'authentication.wrongLoginAttempts': 0,
                status: user_1.USER_STATUS.ACTIVE,
            },
        });
    }
    const isPasswordMatched = await user_model_1.User.isPasswordMatched(payload.password, password);
    if (!isPasswordMatched) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Incorrect password, please try again.');
    }
    const updateData = {
        $set: {
            'authentication.restrictionLeftAt': null,
            'authentication.wrongLoginAttempts': 0,
        }
    };
    if (payload.fcmToken) {
        updateData.$addToSet = { fcmToken: payload.fcmToken };
    }
    await user_model_1.User.findByIdAndUpdate(isUserExist._id, updateData, { new: true });
    const tokens = auth_helper_1.AuthHelper.createToken(isUserExist._id, isUserExist.role, isUserExist.fullName, isUserExist.email);
    const userInfo = {
        id: isUserExist._id,
        role: isUserExist.role,
        name: isUserExist.fullName || 'User',
        email: isUserExist.email,
        image: isUserExist.image,
    };
    return (0, exports.authResponse)(http_status_codes_1.StatusCodes.OK, `Welcome back ${isUserExist.fullName || 'User'}`, undefined, tokens.accessToken, tokens.refreshToken, undefined, userInfo);
};
exports.AuthCommonServices = {
    handleLoginLogic,
};
const authResponse = (status, message, role, accessToken, refreshToken, token, userInfo) => {
    return {
        status,
        message,
        ...(role && { role }),
        ...(accessToken && { accessToken }),
        ...(refreshToken && { refreshToken }),
        ...(token && { token }),
        ...(userInfo && { userInfo }),
    };
};
exports.authResponse = authResponse;
