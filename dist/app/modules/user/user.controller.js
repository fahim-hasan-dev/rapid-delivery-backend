"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const user_service_1 = require("./user.service");
// Update Profile
const updateProfile = (0, catchAsync_1.default)(async (req, res) => {
    const result = await user_service_1.UserServices.updateProfile(req.user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Profile updated successfully',
        data: result
    });
});
const getAllUser = (0, catchAsync_1.default)(async (req, res) => {
    const result = await user_service_1.UserServices.getAllUser(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'User fetched successfully',
        data: { ...result },
    });
});
const getSingleUser = (0, catchAsync_1.default)(async (req, res) => {
    const result = await user_service_1.UserServices.getSingleUser(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'User fetched successfully',
        data: result,
    });
});
const deleteUser = (0, catchAsync_1.default)(async (req, res) => {
    const result = await user_service_1.UserServices.deleteUser(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'User deleted successfully',
    });
});
const getProfile = (0, catchAsync_1.default)(async (req, res) => {
    const result = await user_service_1.UserServices.getProfile(req.user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Profile fetched successfully',
        data: result,
    });
});
const deleteMyAccount = (0, catchAsync_1.default)(async (req, res) => {
    const result = await user_service_1.UserServices.deleteMyAccount(req.user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Account deleted successfully",
    });
});
const resubmitProfile = (0, catchAsync_1.default)(async (req, res) => {
    const result = await user_service_1.UserServices.resubmitProfile(req.user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Profile resubmitted successfully',
        data: result
    });
});
const verifyProfileByAdmin = (0, catchAsync_1.default)(async (req, res) => {
    const result = await user_service_1.UserServices.verifyProfileByAdmin(req.params.id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Profile status updated successfully',
        data: result
    });
});
exports.UserController = {
    getAllUser,
    updateProfile,
    getSingleUser,
    deleteUser,
    getProfile,
    deleteMyAccount,
    resubmitProfile,
    verifyProfileByAdmin
};
