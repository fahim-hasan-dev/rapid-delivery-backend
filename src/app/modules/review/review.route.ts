import express from 'express'
import { ReviewController } from './review.controller'
import validateRequest from '../../middleware/validateRequest'
import { ReviewValidation } from './review.validation'

const router = express.Router()

router.post(
  '/',
  validateRequest(ReviewValidation.addReviewSchema),
  ReviewController.createReview,
)

router.get('/', ReviewController.getAllReviews)
router.get('/driver/:driverId', ReviewController.getReviewsByDriver)
router.get('/:id', ReviewController.getSingleReview)
router.delete('/:id', ReviewController.deleteReview)


export const ReviewRoutes = router
