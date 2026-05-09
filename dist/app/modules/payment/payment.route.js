"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRoutes = void 0;
const express_1 = require("express");
const payment_controller_1 = require("./payment.controller");
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const router = (0, express_1.Router)();
router.post("/checkout-session/:referenceId", (0, auth_1.default)(user_1.USER_ROLES.SENDER, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), payment_controller_1.PaymentController.createCheckoutSession);
router.get("/", (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), payment_controller_1.PaymentController.getPaymentsController);
router.get("/:id", (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), payment_controller_1.PaymentController.getPaymentByIdController);
exports.PaymentRoutes = router;
