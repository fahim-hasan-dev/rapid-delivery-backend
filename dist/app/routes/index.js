"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const handleStripeWebhook_1 = __importDefault(require("../../stripe/handleStripeWebhook"));
const user_route_1 = require("../modules/user/user.route");
const auth_route_1 = require("../modules/auth/auth.route");
const review_route_1 = require("../modules/review/review.route");
const payment_route_1 = require("../modules/payment/payment.route");
const public_route_1 = require("../modules/public/public.route");
const token_route_1 = require("../modules/token/token.route");
const chat_routes_1 = require("../modules/chat/chat.routes");
const message_routes_1 = require("../modules/message/message.routes");
const notification_routes_1 = require("../modules/notification/notification.routes");
const parcel_route_1 = require("../modules/parcel/parcel.route");
const setting_route_1 = require("../modules/setting/setting.route");
const vehicle_route_1 = require("../modules/vehicle/vehicle.route");
const adminStats_routes_1 = require("../modules/adminStats/adminStats.routes");
const router = express_1.default.Router();
const apiRoutes = [
    { path: "/user", route: user_route_1.UserRoutes },
    { path: "/auth", route: auth_route_1.AuthRoutes },
    { path: "/review", route: review_route_1.ReviewRoutes },
    { path: "/payment", route: payment_route_1.PaymentRoutes },
    { path: "/public", route: public_route_1.PublicRoutes },
    { path: "/token", route: token_route_1.TokenRoutes },
    { path: "/chat", route: chat_routes_1.ChatRoutes },
    { path: "/message", route: message_routes_1.MessageRoutes },
    { path: "/notification", route: notification_routes_1.NotificationRoutes },
    { path: "/parcel", route: parcel_route_1.ParcelRoutes },
    { path: "/settings", route: setting_route_1.SettingRoutes },
    { path: "/vehicle", route: vehicle_route_1.VehicleRoutes },
    { path: "/admin-stats", route: adminStats_routes_1.AdminStatsRoutes },
];
router.post('/webhook', handleStripeWebhook_1.default);
apiRoutes.forEach(route => router.use(route.path, route.route));
exports.default = router;
