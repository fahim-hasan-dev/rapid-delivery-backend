"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("./user.controller");
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const processReqBody_1 = require("../../middleware/processReqBody");
const router = express_1.default.Router();
// User profile retrieval for current session
router.get('/me', (0, auth_1.default)(user_1.USER_ROLES.SENDER, user_1.USER_ROLES.DRIVER, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.getProfile);
// Admin access to all user records
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.getAllUser);
// Update profile details with optional image upload
router.patch('/profile', (0, auth_1.default)(user_1.USER_ROLES.SENDER, user_1.USER_ROLES.DRIVER, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), (0, processReqBody_1.fileAndBodyProcessorUsingDiskStorage)(), user_controller_1.UserController.updateProfile);
// Driver profile resubmission (NID and License)
router.patch('/resubmit-profile', (0, auth_1.default)(user_1.USER_ROLES.DRIVER), (0, processReqBody_1.fileAndBodyProcessorUsingDiskStorage)(), user_controller_1.UserController.resubmitProfile);
// Admin verification of driver profiles
router.patch('/verify-profile/:id', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.verifyProfileByAdmin);
// Permanent account deletion by the user
router.delete('/me', (0, auth_1.default)(user_1.USER_ROLES.SENDER, user_1.USER_ROLES.DRIVER, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.deleteMyAccount);
// Retrieve public profile of a single user
router.get('/:id', user_controller_1.UserController.getSingleUser);
// Administrative user deletion
router.delete('/:id', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.deleteUser);
exports.UserRoutes = router;
