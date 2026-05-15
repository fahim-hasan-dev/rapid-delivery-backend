import { Model } from 'mongoose'

export type IContact = {
    firstName: string
    lastName: string
    email: string
    phone?: string
    subject: string
    message: string
    isReplied: boolean
    replyMessage?: string
    createdAt?: Date
    updatedAt?: Date
}

export type ContactModel = Model<IContact, Record<string, unknown>>
