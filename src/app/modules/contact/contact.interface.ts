import { Model } from 'mongoose'

export type IContact = {
    name: string
    email: string
    phone?: string
    message: string
    isReplied: boolean
    replyMessage?: string
    createdAt?: Date
    updatedAt?: Date
}

export type ContactModel = Model<IContact, Record<string, unknown>>
