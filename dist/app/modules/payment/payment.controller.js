"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const payment_service_1 = require("./payment.service");
const http_status_codes_1 = require("http-status-codes");
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const handleStripeWebhook_1 = __importDefault(require("../../../stripe/handleStripeWebhook"));
const createCheckoutSession = (0, catchAsync_1.default)(async (req, res) => {
    const result = await payment_service_1.PaymentService.creatSession(req.user, req.params.referenceId);
    res.status(http_status_codes_1.StatusCodes.OK).json({ url: result.url });
});
// create payment
const createPaymentController = (0, catchAsync_1.default)(async (req, res) => {
    const payload = req.body;
    const payment = await payment_service_1.PaymentService.createPayment(payload);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Payment created successfully',
        data: payment,
    });
});
// get payments
const getPaymentsController = (0, catchAsync_1.default)(async (req, res) => {
    const payments = await payment_service_1.PaymentService.getPayments(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Payments retrieved successfully',
        data: payments.data,
        meta: payments.meta,
    });
});
// get payment by id
const getPaymentByIdController = (0, catchAsync_1.default)(async (req, res) => {
    const id = req.params.id;
    const payment = await payment_service_1.PaymentService.getPaymentById(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Payment retrieved successfully',
        data: payment,
    });
});
exports.PaymentController = {
    createCheckoutSession,
    createPaymentController,
    getPaymentsController,
    getPaymentByIdController,
    handleStripeWebhook: handleStripeWebhook_1.default,
};
