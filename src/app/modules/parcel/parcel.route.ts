import express from "express";
import auth from "../../middleware/auth";
import validateRequest from "../../middleware/validateRequest";
import { USER_ROLES } from "../../../enum/user";
import { ParcelController } from "./parcel.controller";
import { ParcelValidation } from "./parcel.validation";

const router = express.Router();

router.post(
    "/create-parcel",
    auth(USER_ROLES.SENDER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    validateRequest(ParcelValidation.createParcelSchema),
    ParcelController.createParcel
);

router.get(
    "/",
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    ParcelController.getAllParcels
);

router.get(
    "/:id",
    auth(USER_ROLES.SENDER, USER_ROLES.DRIVER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    ParcelController.getSingleParcel
);

router.patch(
    "/:id",
    auth(USER_ROLES.SENDER, USER_ROLES.DRIVER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    validateRequest(ParcelValidation.updateParcelSchema),
    ParcelController.updateParcel
);

router.delete(
    "/:id",
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    ParcelController.deleteParcel
);

export const ParcelRoutes = router;
