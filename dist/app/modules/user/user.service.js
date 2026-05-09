"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const user_model_1 = require("./user.model");
const user_1 = require("../../../enum/user");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const notification_service_1 = require("../notification/notification.service");
const getAllUser = async (query) => {
    const userQueryBuilder = new QueryBuilder_1.default(user_model_1.User.find().select('-password -authentication'), query)
        .filter()
        .sort()
        .fields()
        .paginate();
    const users = await userQueryBuilder.modelQuery.lean();
    const paginationInfo = await userQueryBuilder.getPaginationInfo();
    const totalUsers = await user_model_1.User.countDocuments();
    return {
        users,
        staticData: { totalUsers },
        meta: paginationInfo,
    };
};
const getSingleUser = async (id) => {
    return await user_model_1.User.findById(id).select('-password -authentication');
};
const deleteUser = async (id) => {
    const user = await user_model_1.User.findById(id);
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    return await user_model_1.User.findByIdAndDelete(id);
};
const updateProfile = async (user, payload) => {
    const isExistUser = await user_model_1.User.findById(user.authId);
    if (!isExistUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found or deleted.');
    }
    const updatedUser = await user_model_1.User.findOneAndUpdate({ _id: user.authId, status: { $ne: user_1.USER_STATUS.RESTRICTED } }, payload, { new: true });
    if (!updatedUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to update profile');
    }
    return updatedUser;
};
const getProfile = async (user) => {
    const isExistUser = await user_model_1.User.findById(user.authId).lean().select('-password -authentication');
    if (!isExistUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'The requested profile not found or deleted.');
    }
    return isExistUser;
};
const deleteMyAccount = async (user) => {
    const isExistUser = await user_model_1.User.findById(user.authId);
    if (!isExistUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'The requested profile not found or deleted.');
    }
    await user_model_1.User.findByIdAndDelete(isExistUser._id);
    return 'Account deleted successfully';
};
// Driver profile resubmission logic
const resubmitProfile = async (user, payload) => {
    const isExistUser = await user_model_1.User.findById(user.authId);
    if (!isExistUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    const updatedUser = await user_model_1.User.findByIdAndUpdate(user.authId, {
        $set: {
            'driverInfo.nid': payload.nid,
            'driverInfo.drivingLicense': payload.drivingLicense,
            'driverInfo.profileVerification': user_1.PROFILE_VERIFICATION_STATUS.RESUBMITTED
        }
    }, { new: true });
    // Notify all Admins and Super Admins about the resubmission
    const admins = await user_model_1.User.find({ role: { $in: [user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN] } }).select('_id');
    for (const admin of admins) {
        await notification_service_1.NotificationService.insertNotification({
            receiver: admin._id,
            title: 'Profile Resubmitted',
            message: `${isExistUser.fullName || 'A driver'} has resubmitted documents for verification.`,
            screen: 'DRIVER_VERIFICATION',
            type: user_1.USER_ROLES.ADMIN
        });
    }
    return updatedUser;
};
// Admin verification logic for approving or rejecting drivers
const verifyProfileByAdmin = async (id, payload) => {
    const isExistUser = await user_model_1.User.findById(id);
    if (!isExistUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    const updateData = {
        'driverInfo.profileVerification': payload.status
    };
    if (payload.status === user_1.PROFILE_VERIFICATION_STATUS.APPROVED) {
        updateData['driverInfo.rejectReason'] = ""; // Clear reason on approval
    }
    else if (payload.status === user_1.PROFILE_VERIFICATION_STATUS.REJECTED) {
        updateData['driverInfo.rejectReason'] = payload.rejectReason || "Invalid documents.";
    }
    const updatedUser = await user_model_1.User.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    // Notify Driver about the verification result
    const title = payload.status === user_1.PROFILE_VERIFICATION_STATUS.APPROVED ? 'Profile Approved' : 'Profile Rejected';
    const message = payload.status === user_1.PROFILE_VERIFICATION_STATUS.APPROVED
        ? 'Your profile has been approved! You can now start delivery.'
        : `Your profile was rejected. Reason: ${updateData['driverInfo.rejectReason']}`;
    await notification_service_1.NotificationService.insertNotification({
        receiver: isExistUser._id,
        title,
        message,
        screen: 'PROFILE',
        type: user_1.USER_ROLES.DRIVER
    });
    return updatedUser;
};
exports.UserServices = {
    updateProfile,
    getAllUser,
    getSingleUser,
    deleteUser,
    getProfile,
    deleteMyAccount,
    resubmitProfile,
    verifyProfileByAdmin
};
