import express, { NextFunction, Request, Response } from 'express';
import auth from '../../middleware/auth';
import { ChatController } from './chat.controller';
import { USER_ROLES } from '../../../enum/user';
import { StatusCodes } from 'http-status-codes';

const router = express.Router();

router.post(
  "/",
  auth(USER_ROLES.SENDER, USER_ROLES.DRIVER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.body.participant) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: "Participant ID is required" });
        return;
      }
      if (req.body.participant === (req as any).user.authId) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: "Participant ID cannot be same as user" });
        return;
      }
      req.body = {
        participants: [(req as any).user.authId, req.body.participant],
        isAdminSupport: req.body.isAdminSupport || false
      };
      next();
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: "Failed to process chat request" });
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
