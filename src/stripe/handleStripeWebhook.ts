import { Request, Response } from 'express'
import Stripe from 'stripe'
import { StatusCodes } from 'http-status-codes'
import config from '../config'
import stripe from '../config/stripe'
import ApiError from '../errors/ApiError'
import { logger } from '../shared/logger'
import { Payment } from '../app/modules/payment/payment.model'

const handleStripeWebhook = async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string
    const webhookSecret = config.stripe.webhookSecret as string
    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret)
    } catch (error) {
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
                logger.info('✅ Checkout completed:', session.id)

                if (session.mode === 'payment') {
                    await Payment.create({
                        email: session.customer_details?.email,
                        amount: (session.amount_total || 0) / 100,
                        transactionId: session.payment_intent as string || session.id,
                        dateTime: new Date(),
                        customerName: session.customer_details?.name,
                        referenceId: session.metadata?.referenceId,
                    })
                }
                break
            }

            default:
                logger.info(`⚠️ Unhandled event type: ${eventType}`)
        }
    } catch (error) {
        logger.error('Webhook error:', error)
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `${error}`)
    }

    res.sendStatus(200)
}

export default handleStripeWebhook
