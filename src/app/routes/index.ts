import express from 'express';
import handleStripeWebhook from '../../stripe/handleStripeWebhook';
import { UserRoutes } from '../modules/user/user.route';
import { AuthRoutes } from '../modules/auth/auth.route';


import { ReviewRoutes } from '../modules/review/review.route';
import { PaymentRoutes } from '../modules/payment/payment.route';
import { PublicRoutes } from '../modules/public/public.route';
import { TokenRoutes } from '../modules/token/token.route';

import { ChatRoutes } from '../modules/chat/chat.routes';
import { MessageRoutes } from '../modules/message/message.routes';
import { NotificationRoutes } from '../modules/notification/notification.routes';
import { ParcelRoutes } from '../modules/parcel/parcel.route';



const router = express.Router();

const apiRoutes = [
    { path: "/user", route: UserRoutes },
    { path: "/auth", route: AuthRoutes },

    { path: "/review", route: ReviewRoutes },
    { path: "/payment", route: PaymentRoutes },
    { path: "/public", route: PublicRoutes },
    { path: "/token", route: TokenRoutes },

    { path: "/chat", route: ChatRoutes },
    { path: "/message", route: MessageRoutes },
    { path: "/notification", route: NotificationRoutes },
    { path: "/parcel", route: ParcelRoutes },
]

router.post('/webhook', handleStripeWebhook);

apiRoutes.forEach(route => router.use(route.path, route.route));
export default router;
