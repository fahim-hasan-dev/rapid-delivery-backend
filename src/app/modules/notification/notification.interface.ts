import { Model, Types } from 'mongoose';
import { USER_ROLES } from '../../../enum/user';

export type INotification = {
    title: string;
    message: string;
    receiver: Types.ObjectId;
    read: boolean;
    screen?: string;
    type: USER_ROLES;
};

export type NotificationModel = Model<INotification>;