import express from "express";
import { PlanController } from "./plan.controller";
import { createPlanZodValidationSchema, updatePlanZodValidationSchema } from "./plan.validation";
import auth from "../../middleware/auth";
import { USER_ROLES } from "../../../enum/user";
import validateRequest from "../../middleware/validateRequest";

const router = express.Router()

// Plan management routes for super admins and senders
router.route("/")
    .post(
        auth(USER_ROLES.ADMIN),
        validateRequest(createPlanZodValidationSchema),
        PlanController.createPlan
    )
    .get(
        auth(USER_ROLES.ADMIN, USER_ROLES.SENDER),
        PlanController.getPlan
    )

// Payment checkout initiation for subscription plans
router.post(
    "/create-checkout-session/:planId",
    auth(USER_ROLES.SENDER),
    PlanController.createCheckoutSession
)

// Individual plan management routes
router
    .route("/:id")
    .patch(
        auth(USER_ROLES.ADMIN),
        validateRequest(updatePlanZodValidationSchema),
        PlanController.updatePlan
    )
    .delete(auth(USER_ROLES.ADMIN), PlanController.deletePlan)

export const PlanRoutes = router;