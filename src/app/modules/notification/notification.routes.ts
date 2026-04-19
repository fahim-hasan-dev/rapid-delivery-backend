import express from 'express';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enum/user';
import { NotificationController } from './notification.controller';

const router = express.Router();

// Retrieve all notifications for the authenticated user
router.get('/',
    auth(USER_ROLES.SENDER, USER_ROLES.DRIVER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    NotificationController.getNotificationFromDB
);

// Get the count of unread notifications
router.get('/unread-count',
    auth(USER_ROLES.SENDER, USER_ROLES.DRIVER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    NotificationController.getUnreadCount
);

// Endpoint for testing push notification functionality
router.post('/test-push', NotificationController.sendTestPushNotification);

export const NotificationRoutes = router;

