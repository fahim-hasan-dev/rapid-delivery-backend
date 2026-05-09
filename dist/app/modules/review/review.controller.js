"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const review_service_1 = require("./review.service");
const http_status_codes_1 = require("http-status-codes");
// create review
const createReview = (0, catchAsync_1.default)(async (req, res) => {
    const payload = req.body;
    const result = await review_service_1.ReviewService.createReview(payload);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Review created successfully',
        data: result,
    });
});
// get all reviews
const getAllReviews = (0, catchAsync_1.default)(async (req, res) => {
    const result = await review_service_1.ReviewService.getAllReviews(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Reviews retrieved successfully',
        data: result,
    });
});
// get single review
const getSingleReview = (0, catchAsync_1.default)(async (req, res) => {
    const id = req.params.id;
    const result = await review_service_1.ReviewService.getSingleReview(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Review retrieved successfully',
        data: result,
    });
});
// delete review
const deleteReview = (0, catchAsync_1.default)(async (req, res) => {
    const id = req.params.id;
    const result = await review_service_1.ReviewService.deleteReview(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Review deleted successfully',
    });
});
const getReviewsByDriver = (0, catchAsync_1.default)(async (req, res) => {
    const driverId = req.params.driverId;
    const result = await review_service_1.ReviewService.getReviewsByDriver(driverId, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Driver reviews retrieved successfully',
        data: result,
    });
});
exports.ReviewController = {
    createReview,
    getAllReviews,
    getSingleReview,
    deleteReview,
    getReviewsByDriver,
};
