import crypto from 'crypto';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import config from '../config';
import ApiError from '../errors/ApiError';
import catchAsync from '../shared/catchAsync';
import { logger } from '../shared/logger';
import { Payment } from '../app/modules/payment/payment.model';
import { Parcel } from '../app/modules/parcel/parcel.model';
import { trackingService } from '../helpers/trackingService';

const handleCamerPayWebhook = catchAsync(async (req: Request, res: Response) => {
    logger.info('🔔 CamerPay Webhook Received');

    const payload = req.body || {};
    logger.info(`Webhook payload: ${JSON.stringify(payload)}`);

    const signature = (
        req.headers['x-camerpay-signature'] ||
        payload.signature ||
        req.headers['signature']
    ) as string | undefined;

    const uuid = payload.uuid || payload.transaction_uuid || payload.id;
    const invoiceId = payload.invoice_id || payload.merchant_invoice_id || payload.referenceId;
    const status = (payload.status || payload.event || '').toString().toLowerCase();

    let amount = payload.amount;
    if (typeof amount === 'number') {
        amount = amount.toFixed(2);
    } else if (typeof amount === 'string' && !amount.includes('.')) {
        amount = Number(amount).toFixed(2);
    }

    const webhookSecret = config.camerpay.webhookSecret;

    if (webhookSecret && signature && uuid && invoiceId && status && amount) {
        const dataToSign = `${uuid}|${invoiceId}|${status}|${amount}`;
        const computedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(dataToSign)
            .digest('hex');

        const signatureBuffer = Buffer.from(signature, 'utf8');
        const computedBuffer = Buffer.from(computedSignature, 'utf8');

        if (
            signatureBuffer.length !== computedBuffer.length ||
            !crypto.timingSafeEqual(signatureBuffer, computedBuffer)
        ) {
            logger.error('❌ CamerPay webhook signature verification failed');
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid webhook signature');
        }

        logger.info('✅ CamerPay webhook signature verified');
    }

    const isSuccess =
        status === 'completed' ||
        status === 'successful' ||
        status === 'paid' ||
        status === 'success' ||
        status === 'transaction.completed';

    const referenceId = invoiceId;

    if (isSuccess && referenceId) {
        const paymentData = {
            email: payload.customer_email || payload.email || 'customer@camerpay.biz',
            amount: Number(amount) || 0,
            transactionId: String(uuid || referenceId),
            dateTime: new Date(),
            customerName: payload.customer_name || payload.customer_phone,
            referenceId: referenceId,
        };

        await Payment.create(paymentData);
        logger.info('💰 Payment record created in database');

        const updatedParcel = await Parcel.findByIdAndUpdate(
            referenceId,
            { status: 'PENDING' },
            { new: true }
        ).populate({
            path: 'sender',
            select: 'fullName image phone',
        });

        if (updatedParcel) {
            logger.info(`✅ Parcel ${referenceId} status successfully updated to PENDING`);
            await trackingService.notifyNearbyDrivers(updatedParcel);
        } else {
            logger.warn(`⚠️ Parcel ${referenceId} not found in database during status update`);
        }
    } else {
        logger.info(`ℹ️ Webhook event status: ${status}, skipping parcel update`);
    }

    res.status(StatusCodes.OK).json({ received: true });
});

export default handleCamerPayWebhook;
