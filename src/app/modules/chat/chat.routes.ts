import express from 'express';
import auth from '../../middleware/auth';
import { ChatController } from './chat.controller';
import { USER_ROLES } from '../../../enum/user';

const router = express.Router();

// Initialize a new conversation between two users
router.post(
  "/",
  auth(USER_ROLES.SENDER, USER_ROLES.DRIVER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  async (req, res, next) => {
    try {
      req.body = {
        participants: [req.user.id, req.body.participant],
        isAdminSupport: false
      };
      next();
    } catch (error) {
      res.status(400).json({ message: "Failed to create chat" });
    }
  },
  ChatController.createChat
);

// Fetch all active conversations for the authenticated user
router.get(
  "/",
  auth(USER_ROLES.SENDER, USER_ROLES.DRIVER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  ChatController.getChat
);

// Remove a chat session from the user's active list
router.delete(
  "/:id",
  auth(USER_ROLES.SENDER, USER_ROLES.DRIVER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  ChatController.deleteChat
);

export const ChatRoutes = router;

