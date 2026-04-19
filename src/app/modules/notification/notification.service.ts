import { JwtPayload } from 'jsonwebtoken';
import { INotification } from './notification.interface';
import { Notification } from './notification.model';
import { FilterQuery } from 'mongoose';
import QueryBuilder from '../../builder/QueryBuilder';
import { PushNotificationService } from './pushNotification.service';
import { User } from '../user/user.model';

// Log and dispatch a new notification via push and socket
const insertNotification = async (payload: Partial<INotification>): Promise<INotification> => {
    const result = await Notification.create(payload);

    // Identify the receiver and dispatch push notifications if tokens exist
    if (result.title && result.message) {
        const receiverUser = await User.findById(result.receiver).select('fcmToken fullName');

        if (receiverUser?.fcmToken && receiverUser.fcmToken.length > 0) {
            await PushNotificationService.sendPushNotification(
                receiverUser.fcmToken,
                result.title,
                result.message,
                { referenceId: result.referenceId, screen: result.screen }
            );
        }
    }

    // Emit socket event for real-time in-app notification updates
    //@ts-ignore
    const io = global.io;
    if (io && result.receiver) {
        io.emit(`notification::${result.receiver.toString()}`, result);
    }

    return result;
};

// Retrieve paginated notifications and mark them as read for the user
const getNotificationFromDB = async (user: JwtPayload, query: FilterQuery<any>): Promise<Object> => {
    const result = new QueryBuilder(Notification.find({ receiver: user.id }), query).paginate();
    const notifications = await result.modelQuery;
    const pagination = await result.getPaginationInfo();

    const unreadCount = await Notification.countDocuments({
        receiver: user.id,
        read: false,
    });

    // Automatically mark retrieved unread notifications as seen
    await Notification.updateMany(
        { receiver: user.id, read: false },
        { $set: { read: true } }
    );

    return {
        notifications,
        pagination,
        unreadCount
    };
};

// Count only the notifications that haven't been read by the user
const getUnreadCountFromDB = async (user: JwtPayload): Promise<number> => {
    return await Notification.countDocuments({
        receiver: user.id,
        read: false,
    });
};

export const NotificationService = {
    insertNotification,
    getNotificationFromDB,
    getUnreadCountFromDB,
};

