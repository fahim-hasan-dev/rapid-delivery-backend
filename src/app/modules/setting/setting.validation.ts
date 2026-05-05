import { z } from "zod";

const updateSettingZodSchema = z.object({
    body: z.object({
        vehicleBaseFares: z.object({
            motorcycle: z.number().optional(),
            tricycle: z.number().optional(),
            van: z.number().optional(),
        }).optional(),
        perKiloCost: z.number().min(0).optional(),
        platformCommissionPercentage: z.number().min(0).max(100).optional(),
    }),
});

export const SettingValidations = {
    updateSettingZodSchema,
};
