import mongoose, { Schema } from "mongoose"
import { IReview } from "./review.interface"

const ReviewSchema = new mongoose.Schema<IReview>({
  driver: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
  },
  email: {
    type: String,
  },
  rating: {
    type: Number,
    required: true,
  },
  comment: {
    type: String
  },
}, {
  timestamps: true,
})

export const Review = mongoose.model<IReview>('Review', ReviewSchema)
