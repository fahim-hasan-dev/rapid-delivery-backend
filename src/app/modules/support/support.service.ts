import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { ISupport } from './support.interface';
import { Support } from './support.model';
import { JwtPayload } from 'jsonwebtoken';
import QueryBuilder from '../../builder/QueryBuilder';
import { User } from '../user/user.model';
import { USER_ROLES } from '../../../enum/user';
import { NotificationService } from '../notification/notification.service';
import mongoose from 'mongoose';

const createSupportTicket = async (user: JwtPayload, payload: Partial<ISupport>) => {
    payload.user = new mongoose.Types.ObjectId(user.authId);
    const result = await Support.create(payload);

    // Notify all Admins and Super Admins about the new support ticket
    const admins = await User.find({ role: { $in: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN] } }).select('_id');

    for (const admin of admins) {
        await NotificationService.insertNotification({
            receiver: admin._id,
            title: 'New Support Ticket',
            message: `A new support ticket "${result.title}" has been created by ${user.role}.`,
            screen: 'SUPPORT_DETAILS',
            type: USER_ROLES.ADMIN
        });
    }

    return result;
};

const getAllSupportTickets = async (query: Record<string, unknown>) => {
    const supportQuery = new QueryBuilder(Support.find().populate('user', 'fullName email phone image role'), query)
        .filter()
        .sort()
        .paginate()
        .fields();

    const result = await supportQuery.modelQuery.lean();
    const meta = await supportQuery.getPaginationInfo();

    return { result, meta };
};

const getMySupportTickets = async (user: JwtPayload, query: Record<string, unknown>) => {
    const supportQuery = new QueryBuilder(
        Support.find({ user: user.authId }).populate('user', 'fullName email phone image role'),
        query
    )
        .filter()
        .sort()
        .paginate()
        .fields();

    const result = await supportQuery.modelQuery.lean();
    const meta = await supportQuery.getPaginationInfo();

    return { result, meta };
};

const replyToSupportTicket = async (id: string, payload: { adminReply: string, status?: 'pending' | 'resolved' }) => {
    const support = await Support.findById(id);
    if (!support) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Support ticket not found');
    }

    const result = await Support.findByIdAndUpdate(
        id,
        {
            adminReply: payload.adminReply,
            isReplied: true,
            status: payload.status || 'resolved'
        },
        { new: true }
    );

    // Notify User about the admin reply
    await NotificationService.insertNotification({
        receiver: support.user,
        title: 'Support Ticket Replied',
        message: `Admin has replied to your ticket: "${support.title}".`,
        screen: 'SUPPORT_DETAILS',
        type: USER_ROLES.SENDER // Using SENDER role as generic recipient type here
    });

    return result;
};

const deleteSupportTicket = async (id: string) => {
    const support = await Support.findById(id);
    if (!support) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Support ticket not found');
    }
    return await Support.findByIdAndDelete(id);
};

export const SupportService = {
    createSupportTicket,
    getAllSupportTickets,
    getMySupportTickets,
    replyToSupportTicket,
    deleteSupportTicket
};
