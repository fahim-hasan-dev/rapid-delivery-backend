import { model, Schema } from 'mongoose';
import { INotification, NotificationModel } from './notification.interface';
import { USER_ROLES } from '../../../enum/user';

const notificationSchema = new Schema<INotification, NotificationModel>(
    {
        title: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        receiver: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        screen: {
            type: String,
            required: false
        },
        read: {
            type: Boolean,
            default: false
        },
        type: {
            type: String,
            enum: Object.values(USER_ROLES),
            default: USER_ROLES.SENDER
        }
    },
    {
        timestamps: true
    }
);

export const Notification = model<INotification, NotificationModel>(
    'Notification',
    notificationSchema
);
