import QueryBuilder from '../../builder/QueryBuilder'
import { IReview } from './review.interface'
import { Review } from './review.model'
import { User } from '../user/user.model'
import mongoose from 'mongoose'

// create review
const createReview = async (payload: IReview) => {
  const result = await Review.create(payload)

  // Recalculate average and total rating for the driver
  const driverId = new mongoose.Types.ObjectId(String(payload.driver))
  
  const stats = await Review.aggregate([
    { $match: { driver: driverId } },
    {
      $group: {
        _id: '$driver',
        averageRating: { $avg: '$rating' },
        totalRating: { $sum: 1 }
      }
    }
  ])

  if (stats.length > 0) {
    await User.findByIdAndUpdate(driverId, {
      $set: {
        'driverInfo.averageRating': Number(stats[0].averageRating.toFixed(1)),
        'driverInfo.totalRating': stats[0].totalRating
      }
    })
  }

  return result
}

// get all reviews
const getAllReviews = async (query: Record<string, unknown>) => {
  const reviewQueryBuilder = new QueryBuilder(Review.find().populate('sender', 'fullName image'), query)
    .filter()
    .sort()
    .fields()
    .paginate()

  const reviews = await reviewQueryBuilder.modelQuery
  const paginationInfo = await reviewQueryBuilder.getPaginationInfo()

  return {
    reviews,
    meta: paginationInfo,
  }
}

const getReviewsByDriver = async (driverId: string, query: Record<string, unknown>) => {
  const reviewQueryBuilder = new QueryBuilder(Review.find({ driver: driverId }).populate('sender', 'fullName image'), query)
    .filter()
    .sort()
    .fields()
    .paginate()

  const reviews = await reviewQueryBuilder.modelQuery
  const paginationInfo = await reviewQueryBuilder.getPaginationInfo()

  return {
    reviews,
    meta: paginationInfo,
  }
}

// get single review
const getSingleReview = async (id: string) => {
  const result = await Review.findById(id).populate('sender', 'fullName image').populate('driver', 'fullName')
  return result
}

// delete review
const deleteReview = async (id: string) => {
  const isExist = await Review.findById(id)
  if (!isExist) {
    throw new Error('Review not found')
  }
  const result = await Review.findByIdAndDelete(id)
  return result
}

export const ReviewService = {
  createReview,
  getAllReviews,
  getSingleReview,
  deleteReview,
  getReviewsByDriver,
}
