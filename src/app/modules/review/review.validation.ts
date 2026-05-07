import { z } from 'zod'

const addReviewSchema = z.object({
  body: z.object({
    driver: z.string().min(1, 'Driver ID is required'),
    sender: z.string().min(1, 'Sender ID is required'),
    name: z.string().optional(),
    email: z.string().email().optional(),
    rating: z
      .number()
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating must be at most 5'),
    comment: z.string().optional(),
  }),
})

export const ReviewValidation = {
  addReviewSchema,
}
