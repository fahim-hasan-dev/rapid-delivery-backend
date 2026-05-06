import express from 'express'
import { UserController } from './user.controller'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { fileAndBodyProcessorUsingDiskStorage } from '../../middleware/processReqBody'

const router = express.Router()

// User profile retrieval for current session
router.get(
  '/me',
  auth(USER_ROLES.SENDER, USER_ROLES.DRIVER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  UserController.getProfile,
)

// Admin access to all user records
router.get('/', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), UserController.getAllUser);

// Update profile details with optional image upload
router.patch(
  '/profile',
  auth(USER_ROLES.SENDER, USER_ROLES.DRIVER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  fileAndBodyProcessorUsingDiskStorage(),
  UserController.updateProfile,
)

// Driver profile resubmission (NID and License)
router.patch(
  '/resubmit-profile',
  auth(USER_ROLES.DRIVER),
  fileAndBodyProcessorUsingDiskStorage(),
  UserController.resubmitProfile,
)

// Admin verification of driver profiles
router.patch(
  '/verify-profile/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  UserController.verifyProfileByAdmin,
)

// Permanent account deletion by the user
router.delete(
  '/me',
  auth(USER_ROLES.SENDER, USER_ROLES.DRIVER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  UserController.deleteMyAccount,
)

// Retrieve public profile of a single user
router.get('/:id', UserController.getSingleUser)

// Administrative user deletion
router.delete('/:id', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), UserController.deleteUser)

export const UserRoutes = router
