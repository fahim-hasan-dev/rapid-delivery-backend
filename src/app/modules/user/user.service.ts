import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { User } from './user.model'
import { USER_ROLES, USER_STATUS, PROFILE_VERIFICATION_STATUS } from '../../../enum/user'
import { JwtPayload } from 'jsonwebtoken'
import QueryBuilder from '../../builder/QueryBuilder'
import { NotificationService } from '../notification/notification.service'

const getAllUser = async (query: Record<string, unknown>) => {
    const userQueryBuilder = new QueryBuilder(User.find({ $and: [{ status: { $ne: USER_ROLES.SUPER_ADMIN } }, { 'driverInfo.profileVerification': { $eq: PROFILE_VERIFICATION_STATUS.APPROVED } }] }).select('-password -authentication'), query)
        .filter()
        .sort()
        .fields()
        .paginate()

    const users = await userQueryBuilder.modelQuery
        .select('fullName email phone image role status createdAt')
        .lean()
    const paginationInfo = await userQueryBuilder.getPaginationInfo()
    const totalUsers = await User.countDocuments()

    return {
        users,
        staticData: { totalUsers },
        meta: paginationInfo,
    }
}

const getNewDriverRequests = async (query: Record<string, unknown>) => {
    const userQueryBuilder = new QueryBuilder(User.find({
        role: USER_ROLES.DRIVER,
        'driverInfo.profileVerification': {
            $in: [
                PROFILE_VERIFICATION_STATUS.PENDING,
                PROFILE_VERIFICATION_STATUS.RESUBMITTED,
                PROFILE_VERIFICATION_STATUS.REJECTED,
            ],
        },
    }).select('-password -authentication'), query)
        .filter()
        .sort()
        .fields()
        .paginate()

    const users = await userQueryBuilder.modelQuery
        .select('fullName email phone image role status createdAt')
        .lean()
    const paginationInfo = await userQueryBuilder.getPaginationInfo()
    const totalUsers = await User.countDocuments()

    return {
        users,
        staticData: { totalUsers },
        meta: paginationInfo,
    }
}

const getSingleUser = async (id: string) => {
    return await User.findById(id).select('-password -authentication');
}

const getProfile = async (user: JwtPayload) => {
    const isExistUser = await User.findById(user.authId)
        .populate('driverInfo.assignedVehicle')
        .lean();

    if (!isExistUser) {
        throw new ApiError(
            StatusCodes.NOT_FOUND,
            'The requested profile not found or deleted.',
        )
    }

    return isExistUser
}

const updateProfile = async (
    user: JwtPayload,
    payload: any
) => {
    const isExistUser = await User.findById(user.authId)

    if (!isExistUser) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'User not found or deleted.')
    }

    // Prepare the update object
    const updateData: any = { ...payload };

    // If driverInfo fields are sent at top level (from file middleware), map them correctly
    if (payload.nid) {
        updateData['driverInfo.nid'] = payload.nid;
        delete updateData.nid;
    }
    if (payload.drivingLicense) {
        updateData['driverInfo.drivingLicense'] = payload.drivingLicense;
        delete updateData.drivingLicense;
    }

    const updatedUser = await User.findOneAndUpdate(
        { _id: user.authId, status: { $ne: USER_STATUS.RESTRICTED } },
        { $set: updateData },
        { new: true },
    ).select('-password -authentication')

    if (!updatedUser) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to update profile')
    }

    return updatedUser
}

const resubmitProfile = async (user: JwtPayload, payload: { nid: string[], drivingLicense: string[] }) => {
    const isExistUser = await User.findById(user.authId);
    if (!isExistUser) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }

    const updatedUser = await User.findByIdAndUpdate(
        user.authId,
        {
            $set: {
                'driverInfo.nid': payload.nid,
                'driverInfo.drivingLicense': payload.drivingLicense,
                'driverInfo.profileVerification': PROFILE_VERIFICATION_STATUS.RESUBMITTED
            }
        },
        { new: true }
    );

    // Notify all Admins and Super Admins about the resubmission
    const admins = await User.find({ role: { $in: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN] } }).select('_id');

    for (const admin of admins) {
        await NotificationService.insertNotification({
            receiver: admin._id,
            title: 'Profile Resubmitted',
            message: `${isExistUser.fullName || 'A driver'} has resubmitted documents for verification.`,
            screen: 'DRIVER_VERIFICATION',
            type: USER_ROLES.ADMIN
        });
    }

    return updatedUser;
}

const verifyProfileByAdmin = async (id: string, payload: { status: PROFILE_VERIFICATION_STATUS, rejectReason?: string }) => {
    const isExistUser = await User.findById(id);
    if (!isExistUser) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }

    const updateData: any = {
        'driverInfo.profileVerification': payload.status
    };

    if (payload.status === PROFILE_VERIFICATION_STATUS.APPROVED) {
        updateData['driverInfo.rejectReason'] = ""; // Clear reason on approval
    } else if (payload.status === PROFILE_VERIFICATION_STATUS.REJECTED) {
        updateData['driverInfo.rejectReason'] = payload.rejectReason || "Invalid documents.";
    }

    const updatedUser = await User.findByIdAndUpdate(id, { $set: updateData }, { new: true });

    // Notify Driver about the verification result
    const title = payload.status === PROFILE_VERIFICATION_STATUS.APPROVED ? 'Profile Approved' : 'Profile Rejected';
    const message = payload.status === PROFILE_VERIFICATION_STATUS.APPROVED
        ? 'Your profile has been approved! You can now start delivery.'
        : `Your profile was rejected. Reason: ${updateData['driverInfo.rejectReason']}`;

    await NotificationService.insertNotification({
        receiver: isExistUser._id,
        title,
        message,
        screen: 'PROFILE',
        type: USER_ROLES.DRIVER
    });

    return updatedUser;
}

const suspendAndReactivedUser = async (id:string) => {
    const isExistUser = await User.findById(id);
    if (!isExistUser) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }

    const updateData: any = {
        status: isExistUser.status === USER_STATUS.ACTIVE ? USER_STATUS.RESTRICTED : USER_STATUS.ACTIVE
    };

    const updatedUser = await User.findByIdAndUpdate(id, { $set: updateData }, { new: true });

    return updatedUser;
}

const deleteMyAccount = async (user: JwtPayload) => {
    const isExistUser = await User.findById(user.authId)
    if (!isExistUser) {
        throw new ApiError(
            StatusCodes.NOT_FOUND,
            'The requested profile not found or deleted.',
        )
    }

    await User.findByIdAndDelete(isExistUser._id)

    return 'Account deleted successfully'
}

const deleteUser = async (id: string) => {
    const user = await User.findById(id)
    if (!user) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }

    return await User.findByIdAndDelete(id);
}



export const UserServices = {
    updateProfile,
    getNewDriverRequests,
    getAllUser,
    getSingleUser,
    deleteUser,
    getProfile,
    deleteMyAccount,
    resubmitProfile,
    verifyProfileByAdmin,
    suspendAndReactivedUser
}
