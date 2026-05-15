import { z } from 'zod'

const createContactSchema = z.object({
  body: z.object({
    firstName: z.string({ required_error: 'First name is required' }),
    lastName: z.string({ required_error: 'Last name is required' }),
    email: z.string({ required_error: 'Email is required' }).email(),
    phone: z.string().optional(),
    subject: z.string({ required_error: 'Subject is required' }),
    message: z.string({ required_error: 'Message is required' }),
  }),
})

const replyContactSchema = z.object({
  body: z.object({
    replyMessage: z.string({ required_error: 'Reply message is required' }),
  }),
})

export const ContactValidations = {
  createContactSchema,
  replyContactSchema
}
