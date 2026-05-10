import express from 'express';
import { USER_ROLES } from '../../../enum/user';
import auth from '../../middleware/auth';
import { MessageController } from './message.controller';
import { fileAndBodyProcessorUsingDiskStorage } from '../../middleware/processReqBody';

const router = express.Router();

// Dispatch a new message within a chat session
router.post('/',
  auth(USER_ROLES.SENDER, USER_ROLES.DRIVER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  fileAndBodyProcessorUsingDiskStorage(),
  MessageController.sendMessage
);

// Fetch message history for a specific chat ID
router.get(
  '/:id',
  auth(USER_ROLES.SENDER, USER_ROLES.DRIVER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  MessageController.getMessage
);

// Modify the content of an existing message
router.patch(
  '/:id',
  auth(USER_ROLES.SENDER, USER_ROLES.DRIVER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  fileAndBodyProcessorUsingDiskStorage(),
  MessageController.updateMessage
);

// Get the total number of unread messages for the current user
router.get(
  '/unread/count',
  auth(USER_ROLES.SENDER, USER_ROLES.DRIVER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  MessageController.getUnreadCount
);

// Permanent removal of a message record
router.delete(
  '/:id',
  auth(USER_ROLES.SENDER, USER_ROLES.DRIVER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  MessageController.deleteMessage
);

export const MessageRoutes = router;

