"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const review_model_1 = require("./review.model");
const user_model_1 = require("../user/user.model");
const mongoose_1 = __importDefault(require("mongoose"));
// create review
const createReview = async (payload) => {
    const result = await review_model_1.Review.create(payload);
    // Recalculate average and total rating for the driver
    const driverId = new mongoose_1.default.Types.ObjectId(String(payload.driver));
    const stats = await review_model_1.Review.aggregate([
        { $match: { driver: driverId } },
        {
            $group: {
                _id: '$driver',
                averageRating: { $avg: '$rating' },
                totalRating: { $sum: 1 }
            }
        }
    ]);
    if (stats.length > 0) {
        await user_model_1.User.findByIdAndUpdate(driverId, {
            $set: {
                'driverInfo.averageRating': Number(stats[0].averageRating.toFixed(1)),
                'driverInfo.totalRating': stats[0].totalRating
            }
        });
    }
    return result;
};
// get all reviews
const getAllReviews = async (query) => {
    const reviewQueryBuilder = new QueryBuilder_1.default(review_model_1.Review.find().populate('sender', 'fullName image'), query)
        .filter()
        .sort()
        .fields()
        .paginate();
    const reviews = await reviewQueryBuilder.modelQuery;
    const paginationInfo = await reviewQueryBuilder.getPaginationInfo();
    return {
        reviews,
        meta: paginationInfo,
    };
};
const getReviewsByDriver = async (driverId, query) => {
    const reviewQueryBuilder = new QueryBuilder_1.default(review_model_1.Review.find({ driver: driverId }).populate('sender', 'fullName image'), query)
        .filter()
        .sort()
        .fields()
        .paginate();
    const reviews = await reviewQueryBuilder.modelQuery;
    const paginationInfo = await reviewQueryBuilder.getPaginationInfo();
    return {
        reviews,
        meta: paginationInfo,
    };
};
// get single review
const getSingleReview = async (id) => {
    const result = await review_model_1.Review.findById(id).populate('sender', 'fullName image').populate('driver', 'fullName');
    return result;
};
// delete review
const deleteReview = async (id) => {
    const isExist = await review_model_1.Review.findById(id);
    if (!isExist) {
        throw new Error('Review not found');
    }
    const result = await review_model_1.Review.findByIdAndDelete(id);
    return result;
};
exports.ReviewService = {
    createReview,
    getAllReviews,
    getSingleReview,
    deleteReview,
    getReviewsByDriver,
};
