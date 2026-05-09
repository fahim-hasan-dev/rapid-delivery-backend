"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const config_1 = __importDefault(require("../config"));
const stripe_1 = __importDefault(require("../config/stripe"));
const ApiError_1 = __importDefault(require("../errors/ApiError"));
const logger_1 = require("../shared/logger");
const payment_model_1 = require("../app/modules/payment/payment.model");
const parcel_model_1 = require("../app/modules/parcel/parcel.model");
const handleStripeWebhook = async (req, res) => {
    var _a, _b, _c;
    const signature = req.headers['stripe-signature'];
    const webhookSecret = config_1.default.stripe.webhookSecret;
    let event;
    try {
        event = stripe_1.default.webhooks.constructEvent(req.body, signature, webhookSecret);
    }
    catch (error) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Webhook verification failed: ${error}`);
    }
    const data = event.data.object;
    const eventType = event.type;
    try {
        switch (eventType) {
            case 'checkout.session.completed': {
                const session = data;
                logger_1.logger.info('✅ Checkout completed:', session.id);
                if (session.mode === 'payment') {
                    const referenceId = (_a = session.metadata) === null || _a === void 0 ? void 0 : _a.referenceId;
                    await payment_model_1.Payment.create({
                        email: (_b = session.customer_details) === null || _b === void 0 ? void 0 : _b.email,
                        amount: (session.amount_total || 0) / 100,
                        transactionId: session.payment_intent || session.id,
                        dateTime: new Date(),
                        customerName: (_c = session.customer_details) === null || _c === void 0 ? void 0 : _c.name,
                        referenceId: referenceId,
                    });
                    // Update Parcel Status to PENDING
                    if (referenceId) {
                        const updatedParcel = await parcel_model_1.Parcel.findByIdAndUpdate(referenceId, { status: 'PENDING' }, { new: true });
                        if (updatedParcel) {
                            logger_1.logger.info(`📦 Parcel ${referenceId} status updated to PENDING`);
                        }
                        else {
                            logger_1.logger.warn(`⚠️ Parcel ${referenceId} not found during webhook update`);
                        }
                    }
                }
                break;
            }
            default:
                logger_1.logger.info(`⚠️ Unhandled event type: ${eventType}`);
        }
    }
    catch (error) {
        logger_1.logger.error('Webhook error:', error);
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `${error}`);
    }
    res.sendStatus(200);
};
exports.default = handleStripeWebhook;
