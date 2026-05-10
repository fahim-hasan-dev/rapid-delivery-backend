import { Request, Response } from 'express'
import Stripe from 'stripe'
import { StatusCodes } from 'http-status-codes'
import config from '../config'
import stripe from '../config/stripe'
import ApiError from '../errors/ApiError'
import { logger } from '../shared/logger'
import { Payment } from '../app/modules/payment/payment.model'
import { Parcel } from '../app/modules/parcel/parcel.model'

import catchAsync from '../shared/catchAsync'

const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string
    const webhookSecret = config.stripe.webhookSecret as string
    let event: Stripe.Event

    logger.info('🔔 Stripe Webhook Received');

    try {
        event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret)
        logger.info(`✅ Webhook verified: ${event.type} [${event.id}]`);
    } catch (error) {
        logger.error(`❌ Webhook verification failed: ${error}`);
        throw new ApiError(
            StatusCodes.BAD_REQUEST,
            `Webhook verification failed: ${error}`,
        )
    }

    const data = event.data.object as any
    const eventType = event.type

    try {
        switch (eventType) {
            case 'checkout.session.completed': {
                const session = data as Stripe.Checkout.Session
                logger.info('💳 Checkout session completed:', session.id)
                logger.info('📦 Metadata:', JSON.stringify(session.metadata))

                if (session.mode === 'payment') {
                    const referenceId = session.metadata?.referenceId;
                    logger.info(`🔍 Extracted referenceId: ${referenceId}`);

                    const paymentData = {
                        email: session.customer_details?.email,
                        amount: (session.amount_total || 0) / 100,
                        transactionId: session.payment_intent as string || session.id,
                        dateTime: new Date(),
                        customerName: session.customer_details?.name,
                        referenceId: referenceId,
                    };

                    await Payment.create(paymentData);
                    logger.info('💰 Payment record created in database');

                    // Update Parcel Status to PENDING
                    if (referenceId) {
                        logger.info(`🔄 Attempting to update parcel ${referenceId} to PENDING...`);
                        const updatedParcel = await Parcel.findByIdAndUpdate(
                            referenceId,
                            { status: 'PENDING' },
                            { new: true }
                        );

                        if (updatedParcel) {
                            logger.info(`✅ Parcel ${referenceId} status successfully updated to PENDING`);
                        } else {
                            logger.warn(`⚠️ Parcel ${referenceId} not found in database during status update`);
                        }
                    } else {
                        logger.warn('⚠️ No referenceId found in session metadata');
                    }
                } else {
                    logger.info(`ℹ️ Session mode is ${session.mode}, skipping payment processing`);
                }
                break
            }

            default:
                logger.info(`⚠️ Unhandled event type: ${eventType}`)
        }
    } catch (error) {
        logger.error('❌ Webhook processing error:', error)
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `${error}`)
    }

    res.sendStatus(200)
})

export default handleStripeWebhook
