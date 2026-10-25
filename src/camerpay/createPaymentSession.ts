import axios from 'axios';
import { JwtPayload } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import config from '../config';
import ApiError from '../errors/ApiError';
import { User } from '../app/modules/user/user.model';

export const createPaymentSession = async (
    user: JwtPayload,
    amount: number,
    referenceId: string
): Promise<string> => {
    if (!config.camerpay.apiToken) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'CamerPay API token is not configured');
    }

    let customerPhone: string | undefined = (user as any)?.phone;
    const userId = user.id || (user as any)?.authId;

    if (!customerPhone && userId) {
        const userDoc = await User.findById(userId).select('phone');
        if (userDoc?.phone) {
            customerPhone = userDoc.phone;
        }
    }

    const payload: Record<string, any> = {
        amount: Math.round(amount),
        currency: 'XAF',
        merchant_invoice_id: referenceId,
        merchant_callback_url: `${config.backend_url}/api/v1/webhook`,
        merchant_return_url: `${config.frontend_url}/payment/success`,
    };

    if (customerPhone) {
        payload.customer_phone = customerPhone;
    }

    if (user?.email) {
        payload.customer_email = user.email;
    }

    try {
        const response = await axios.post(
            `${config.camerpay.baseUrl}/api/payment/initiate`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${config.camerpay.apiToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const paymentUrl =
            response.data?.pay_url ||
            response.data?.redirect_url ||
            response.data?.data?.pay_url;

        if (!paymentUrl) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to obtain payment URL from CamerPay');
        }

        return paymentUrl;
    } catch (error: any) {
        const message =
            error.response?.data?.message ||
            error.message ||
            'CamerPay payment initialization failed';

        throw new ApiError(StatusCodes.BAD_REQUEST, `CamerPay Error: ${message}`);
    }
};
