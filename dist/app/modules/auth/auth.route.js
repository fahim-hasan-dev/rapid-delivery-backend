"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("./auth.controller");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const auth_validation_1 = require("./auth.validation");
const user_1 = require("../../../enum/user");
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_validation_1 = require("../user/user.validation");
const fileUploadHandler_1 = __importDefault(require("../../middleware/fileUploadHandler"));
const getFilePath_1 = require("../../../shared/getFilePath");
const router = express_1.default.Router();
// User registration with image upload support
router.post('/signup', (0, fileUploadHandler_1.default)(), async (req, res, next) => {
    try {
        const image = (0, getFilePath_1.getSingleFilePath)(req.files, "image");
        req.body = {
            image,
            ...req.body
        };
        next();
    }
    catch (error) {
        res.status(400).json({ message: "Failed to upload User Image" });
    }
}, (0, validateRequest_1.default)(user_validation_1.UserValidations.userSignupSchema), auth_controller_1.AuthController.createUser);
// Administrative login for dashboard access
router.post('/admin-login', (0, validateRequest_1.default)(auth_validation_1.AuthValidations.loginZodSchema), auth_controller_1.AuthController.adminLogin);
// Standard user login for the mobile/web app
router.post('/login', (0, validateRequest_1.default)(auth_validation_1.AuthValidations.loginZodSchema), auth_controller_1.AuthController.login);
// OTP verification for new accounts
router.post('/verify-account', (0, validateRequest_1.default)(auth_validation_1.AuthValidations.verifyAccountZodSchema), auth_controller_1.AuthController.verifyAccount);
// Alternative login endpoint for custom logic
router.post('/custom-login', (0, validateRequest_1.default)(auth_validation_1.AuthValidations.loginZodSchema), auth_controller_1.AuthController.login);
// Initiate the password recovery process
router.post('/forget-password', (0, validateRequest_1.default)(auth_validation_1.AuthValidations.forgetPasswordZodSchema), auth_controller_1.AuthController.forgetPassword);
// Finalize password reset using the verified token/OTP
router.post('/reset-password', (0, validateRequest_1.default)(auth_validation_1.AuthValidations.resetPasswordZodSchema), auth_controller_1.AuthController.resetPassword);
// Re-dispatch verification code to user
router.post('/resend-otp', (0, validateRequest_1.default)(auth_validation_1.AuthValidations.resendOtpZodSchema), auth_controller_1.AuthController.resendOtp);
// Update existing password while authenticated
router.post('/change-password', (0, auth_1.default)(user_1.USER_ROLES.SENDER, user_1.USER_ROLES.DRIVER, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(auth_validation_1.AuthValidations.changePasswordZodSchema), auth_controller_1.AuthController.changePassword);
// Permanent account deletion request
router.delete('/delete-account', (0, auth_1.default)(user_1.USER_ROLES.SENDER, user_1.USER_ROLES.DRIVER, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(auth_validation_1.AuthValidations.deleteAccount), auth_controller_1.AuthController.deleteAccount);
// Refresh authentication status using token
router.post('/access-token', auth_controller_1.AuthController.getAccessToken);
// End the current user session
router.post('/logout', auth_controller_1.AuthController.logOut);
// Super Admin only: Create new administrative accounts
router.post('/create-admin', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(user_validation_1.UserValidations.userSignupSchema), auth_controller_1.AuthController.createAdmin);
exports.AuthRoutes = router;
