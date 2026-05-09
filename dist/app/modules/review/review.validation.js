"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewValidation = void 0;
const zod_1 = require("zod");
const addReviewSchema = zod_1.z.object({
    body: zod_1.z.object({
        driver: zod_1.z.string().min(1, 'Driver ID is required'),
        sender: zod_1.z.string().min(1, 'Sender ID is required'),
        name: zod_1.z.string().optional(),
        email: zod_1.z.string().email().optional(),
        rating: zod_1.z
            .number()
            .min(1, 'Rating must be at least 1')
            .max(5, 'Rating must be at most 5'),
        comment: zod_1.z.string().optional(),
    }),
});
exports.ReviewValidation = {
    addReviewSchema,
};
