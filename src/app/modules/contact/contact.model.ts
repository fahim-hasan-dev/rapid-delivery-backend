import { Schema, model } from 'mongoose'
import { ContactModel, IContact } from './contact.interface'

const contactSchema = new Schema<IContact, ContactModel>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, optional: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    isReplied: { type: Boolean, default: false },
    replyMessage: { type: String },
    createdAt: { type: Date },
    updatedAt: { type: Date },
  },
  {
    timestamps: true,
  },
)

export const Contact = model<IContact, ContactModel>('Contact', contactSchema)
