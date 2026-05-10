import mongoose, { Schema } from 'mongoose';
import { ISupport, SupportModel } from './support.interface';

const SupportSchema = new Schema<ISupport, SupportModel>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        images: {
            type: [String],
            default: [],
        },
        status: {
            type: String,
            enum: ['pending', 'resolved'],
            default: 'pending',
        },
        adminReply: {
            type: String,
            default: '',
        },
        isReplied: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
    }
);

export const Support = mongoose.model<ISupport, SupportModel>('Support', SupportSchema);
