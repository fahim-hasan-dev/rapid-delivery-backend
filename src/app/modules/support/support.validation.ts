import { z } from 'zod';

const createSupportTicketSchema = z.object({
    body: z.object({
        title: z.string({ required_error: 'Title is required' }),
        description: z.string({ required_error: 'Description is required' }),
        files: z.array(z.string()).optional(),
    }),
});

const replySupportTicketSchema = z.object({
    body: z.object({
        adminReply: z.string({ required_error: 'Reply content is required' }),
        status: z.enum(['pending', 'resolved']).optional(),
    }),
});

export const SupportValidation = {
    createSupportTicketSchema,
    replySupportTicketSchema,
};
