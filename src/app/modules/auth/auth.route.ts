import express from 'express'
import { AuthController } from './auth.controller'
import validateRequest from '../../middleware/validateRequest'
import { AuthValidations } from './auth.validation'
import { USER_ROLES } from '../../../enum/user'
import auth, { tempAuth } from '../../middleware/auth'
import { UserValidations } from '../user/user.validation'
import fileUploadHandler from '../../middleware/fileUploadHandler'
import { getSingleFilePath } from '../../../shared/getFilePath'

const router = express.Router()

// User registration with image upload support
router.post(
  '/signup',
  fileUploadHandler(),
  async (req, res, next) => {
    try {
      const image = getSingleFilePath(req.files, "image");
      req.body = {
        image,
        ...req.body
      };
      next();
    } catch (error) {
      res.status(400).json({ message: "Failed to upload User Image" });
    }
  },
  validateRequest(UserValidations.userSignupSchema),
  AuthController.createUser,
)

// Administrative login for dashboard access
router.post(
  '/admin-login',
  validateRequest(AuthValidations.loginZodSchema),
  AuthController.adminLogin,
)

// Standard user login for the mobile/web app
router.post(
  '/login',
  validateRequest(AuthValidations.loginZodSchema),
  AuthController.login,
)

// OTP verification for new accounts
router.post(
  '/verify-account',
  validateRequest(AuthValidations.verifyAccountZodSchema),
  AuthController.verifyAccount,
)

// Alternative login endpoint for custom logic
router.post(
  '/custom-login',
  validateRequest(AuthValidations.loginZodSchema),
  AuthController.login,
)

// Social login endpoint (Google/Apple via Firebase)
router.post(
  '/social-login',
  validateRequest(AuthValidations.socialLoginZodSchema),
  AuthController.socialLogin,
)

// Role selection endpoint for new social login users
router.post(
  '/select-role',
  tempAuth(),
  validateRequest(AuthValidations.selectRoleZodSchema),
  AuthController.selectRole,
)

// Initiate the password recovery process
router.post(
  '/forget-password',
  validateRequest(AuthValidations.forgetPasswordZodSchema),
  AuthController.forgetPassword,
)

// Finalize password reset using the verified token/OTP
router.post(
  '/reset-password',
  validateRequest(AuthValidations.resetPasswordZodSchema),
  AuthController.resetPassword,
)

// Re-dispatch verification code to user
router.post(
  '/resend-otp',
  validateRequest(AuthValidations.resendOtpZodSchema),
  AuthController.resendOtp,
)

// Update existing password while authenticated
router.post(
  '/change-password',
  auth(USER_ROLES.SENDER, USER_ROLES.DRIVER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(AuthValidations.changePasswordZodSchema),
  AuthController.changePassword,
)

// Permanent account deletion request
router.delete(
  '/delete-account',
  auth(USER_ROLES.SENDER, USER_ROLES.DRIVER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(AuthValidations.deleteAccount),
  AuthController.deleteAccount,
)

// Refresh authentication status using token
router.post('/access-token', AuthController.getAccessToken)

// End the current user session
router.post('/logout', AuthController.logOut)

// Super Admin only: Create new administrative accounts
router.post(
  '/create-admin',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(UserValidations.userSignupSchema),
  AuthController.createAdmin,
)

router.patch(
  '/add-fcm',
  auth(USER_ROLES.SENDER, USER_ROLES.DRIVER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(AuthValidations.fcmTokenZodSchema),
  AuthController.addFcmToken,
)

router.patch(
  '/remove-fcm',
  auth(USER_ROLES.SENDER, USER_ROLES.DRIVER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(AuthValidations.fcmTokenZodSchema),
  AuthController.removeFcmToken,
)

export const AuthRoutes = router

