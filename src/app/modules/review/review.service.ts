import QueryBuilder from '../../builder/QueryBuilder'
import { IReview } from './review.interface'
import { Review } from './review.model'
import { User } from '../user/user.model'
import { Parcel } from '../parcel/parcel.model'
import { JwtPayload } from 'jsonwebtoken'
import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import mongoose from 'mongoose'

// create review
const createReview = async (user: JwtPayload, payload: Partial<IReview> & { parcelId: string }) => {
  if (!payload.parcelId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Parcel ID is required to give a review.")
  }

  const parcel = await Parcel.findById(payload.parcelId)
  if (!parcel) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Parcel not found.")
  }

  if (!parcel.driver) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "This parcel was not assigned to any driver.")
  }

  // Set the sender and driver automatically
  payload.sender = new mongoose.Types.ObjectId(user.authId)
  payload.driver = parcel.driver

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

  // Select essential fields for reviews
  reviewQueryBuilder.modelQuery.select("rating comment sender createdAt").lean()

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

  // Select essential fields for reviews
  reviewQueryBuilder.modelQuery.select("rating comment sender createdAt").lean()

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
