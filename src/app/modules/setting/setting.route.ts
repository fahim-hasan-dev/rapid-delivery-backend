import express from "express";
import validateRequest from "../../middleware/validateRequest";
import { SettingControllers } from "./setting.controller";
import { SettingValidations } from "./setting.validation";

const router = express.Router();

router.get("/", SettingControllers.getSettings);
router.patch(
    "/",
    validateRequest(SettingValidations.updateSettingZodSchema),
    SettingControllers.updateSettings
);

export const SettingRoutes = router;
