import { z } from 'zod'

const createContactSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }),
    email: z.string({ required_error: 'Email is required' }).email(),
    phone: z.string().optional(),
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
