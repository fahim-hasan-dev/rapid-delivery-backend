import { Router } from "express";
import { PaymentController } from "./payment.controller";
import auth from "../../middleware/auth";
import { USER_ROLES } from "../../../enum/user";

const router = Router();

router.post(
    "/checkout-session/:referenceId",
    auth(USER_ROLES.SENDER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    PaymentController.createCheckoutSession
);

router.get(
    "/",
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    PaymentController.getPaymentsController
);

router.get(
    "/:id",
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    PaymentController.getPaymentByIdController
);

export const PaymentRoutes = router;
