import { Model, Types } from 'mongoose';

export type ISupport = {
    user: Types.ObjectId;
    title: string;
    description: string;
    images?: string[];
    status: 'pending' | 'resolved';
    adminReply?: string;
    isReplied: boolean;
};

export type SupportModel = Model<ISupport>;
