"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tempAuth = void 0;
const http_status_codes_1 = require("http-status-codes");
const config_1 = __importDefault(require("../../config"));
const jwtHelper_1 = require("../../helpers/jwtHelper");
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const user_model_1 = require("../modules/user/user.model");
const user_1 = require("../../enum/user");
const auth = (...roles) => async (req, res, next) => {
    var _a;
    try {
        const tokenWithBearer = req.headers.authorization;
        if (!tokenWithBearer) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Token not found!');
        }
        if (tokenWithBearer && tokenWithBearer.startsWith('Bearer')) {
            const token = tokenWithBearer.split(' ')[1];
            try {
                // Verify token
                const verifyUser = jwtHelper_1.jwtHelper.verifyToken(token, config_1.default.jwt.jwt_secret);
                // Set user to header
                req.user = verifyUser;
                // Guard user
                if (roles.length && !roles.includes(verifyUser.role)) {
                    throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You don't have permission to access this API");
                }
                // Driver specific profile verification guard
                if (verifyUser.role === user_1.USER_ROLES.DRIVER) {
                    const isGetProfile = req.method === 'GET' && req.originalUrl.includes('/users/me');
                    const isResubmitProfile = req.originalUrl.includes('/users/resubmit-profile');
                    if (!isGetProfile && !isResubmitProfile) {
                        const driver = await user_model_1.User.findById(verifyUser.authId).lean();
                        if (((_a = driver === null || driver === void 0 ? void 0 : driver.driverInfo) === null || _a === void 0 ? void 0 : _a.profileVerification) !== user_1.PROFILE_VERIFICATION_STATUS.APPROVED) {
                            throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Your profile is not approved yet. You can only access your profile and resubmit documents.");
                        }
                    }
                }
                next();
            }
            catch (error) {
                if (error instanceof Error && error.name === 'TokenExpiredError') {
                    throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Access Token has expired');
                }
                next(error);
            }
        }
    }
    catch (error) {
        next(error);
    }
};
exports.default = auth;
//this temp auth middleware is created for temporary user verification before creating a new user
//in the future, we will use the auth middleware above
const tempAuth = (...roles) => async (req, res, next) => {
    try {
        const tokenWithBearer = req.headers.authorization;
        console.log('tempAuth tokenWithBearer', req.headers.authorization);
        if (!tokenWithBearer) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Token not found!');
        }
        if (tokenWithBearer && tokenWithBearer.startsWith('Bearer')) {
            const token = tokenWithBearer.split(' ')[1];
            console.log({ token });
            try {
                // Verify token
                const verifyUser = jwtHelper_1.jwtHelper.verifyToken(token, config_1.default.jwt.temp_jwt_secret);
                console.log({ verifyUser });
                // Set user to header
                req.user = verifyUser;
                // Guard user
                if (roles.length && !roles.includes(verifyUser.role)) {
                    throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You don't have permission to access this API");
                }
                next();
            }
            catch (error) {
                if (error instanceof Error && error.name === 'TokenExpiredError') {
                    throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Access Token has expired');
                }
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Invalid Access Token');
            }
        }
    }
    catch (error) {
        next(error);
    }
};
exports.tempAuth = tempAuth;
