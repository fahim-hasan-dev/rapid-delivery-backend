import { Types } from 'mongoose'

export interface IReview {
  _id?: Types.ObjectId
  driver: Types.ObjectId
  sender: Types.ObjectId
  name?: string
  email?: string
  rating: number
  comment?: string
}
