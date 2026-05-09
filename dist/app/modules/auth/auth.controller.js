"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const auth_service_1 = require("./auth.service");
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const config_1 = __importDefault(require("../../../config"));
const customLogin = (0, catchAsync_1.default)(async (req, res) => {
    const { ...loginData } = req.body;
    const result = await auth_service_1.AuthServices.login(loginData);
    const { status, message, accessToken, refreshToken, role, userInfo } = result;
    if (refreshToken) {
        res.cookie('refreshToken', refreshToken, {
            secure: config_1.default.node_env === 'production',
            httpOnly: true,
        });
    }
    (0, sendResponse_1.default)(res, {
        statusCode: status,
        success: true,
        message: message,
        data: { accessToken, refreshToken, userInfo },
    });
});
const adminLogin = (0, catchAsync_1.default)(async (req, res) => {
    const { ...loginData } = req.body;
    const result = await auth_service_1.AuthServices.adminLogin(loginData);
    const { status, message, accessToken, refreshToken, role } = result;
    (0, sendResponse_1.default)(res, {
        statusCode: status,
        success: true,
        message: message,
        data: { accessToken, refreshToken, role },
    });
});
const forgetPassword = (0, catchAsync_1.default)(async (req, res) => {
    const { email, phone } = req.body;
    const result = await auth_service_1.AuthServices.forgetPassword(email.toLowerCase().trim(), phone);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: `An OTP has been sent to your ${email || phone}. Please verify your email.`,
        data: result,
    });
});
const resetPassword = (0, catchAsync_1.default)(async (req, res) => {
    const token = req.query.token;
    const { ...resetData } = req.body;
    const result = await auth_service_1.AuthServices.resetPassword(token, resetData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Password reset successfully, please login now.',
        data: result,
    });
});
const verifyAccount = (0, catchAsync_1.default)(async (req, res) => {
    const { oneTimeCode, phone, email } = req.body;
    const result = await auth_service_1.AuthServices.verifyAccount(email, oneTimeCode);
    const { status, message, accessToken, refreshToken, token, userInfo } = result;
    if (refreshToken) {
        res.cookie('refreshToken', refreshToken, {
            secure: config_1.default.node_env === 'production',
            httpOnly: true,
        });
    }
    (0, sendResponse_1.default)(res, {
        statusCode: status,
        success: true,
        message: message,
        data: { accessToken, refreshToken, token, userInfo },
    });
});
const getAccessToken = (0, catchAsync_1.default)(async (req, res) => {
    const { refreshToken } = req.cookies;
    const result = await auth_service_1.AuthServices.getAccessToken(refreshToken);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Token refreshed successfully',
        data: result,
    });
});
const resendOtp = (0, catchAsync_1.default)(async (req, res) => {
    const { email, phone, authType } = req.body;
    const result = await auth_service_1.AuthServices.resendOtp(email, authType);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: `An OTP has been sent to your ${email || phone}. Please verify your email.`,
    });
});
const changePassword = (0, catchAsync_1.default)(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const result = await auth_service_1.AuthServices.changePassword(req.user, currentPassword, newPassword);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Password changed successfully',
        data: result,
    });
});
const createUser = (0, catchAsync_1.default)(async (req, res) => {
    const { ...userData } = req.body;
    const result = await auth_service_1.AuthServices.createUser(userData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'User created successfully',
        data: result,
    });
});
const deleteAccount = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const { password } = req.body;
    const result = await auth_service_1.AuthServices.deleteAccount(user, password);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Account deleted successfully',
        data: result,
    });
});
const createAdmin = (0, catchAsync_1.default)(async (req, res) => {
    const { ...adminData } = req.body;
    const result = await auth_service_1.AuthServices.createAdmin(adminData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Admin account created successfully',
        data: result,
    });
});
const logOut = (0, catchAsync_1.default)(async (req, res) => {
    res.clearCookie('refreshToken', {
        secure: config_1.default.node_env === 'production',
        httpOnly: true,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Logged out successfully',
    });
});
exports.AuthController = {
    forgetPassword,
    resetPassword,
    verifyAccount,
    login: customLogin,
    getAccessToken,
    resendOtp,
    changePassword,
    createUser,
    deleteAccount,
    adminLogin,
    logOut,
    createAdmin
};
