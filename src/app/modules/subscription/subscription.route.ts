import express from "express";
import { SubscriptionController } from "./subscription.controller";
import auth from "../../middleware/auth";
import { USER_ROLES } from "../../../enum/user";

const router = express.Router();

// Administrative view for all subscription records
router.get("/",
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    SubscriptionController.subscriptions
);

// Individual user access to their own subscription details
router.get("/my-plan",
    auth(USER_ROLES.SENDER),
    SubscriptionController.subscriptionDetails
);

export const SubscriptionRoutes = router;