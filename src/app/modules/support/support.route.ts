import express from 'express';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enum/user';
import validateRequest from '../../middleware/validateRequest';
import { SupportValidation } from './support.validation';
import { SupportController } from './support.controller';
import { fileAndBodyProcessorUsingDiskStorage } from '../../middleware/processReqBody';

const router = express.Router();

router.post(
    '/',
    auth(USER_ROLES.SENDER, USER_ROLES.DRIVER),
    fileAndBodyProcessorUsingDiskStorage(),
    validateRequest(SupportValidation.createSupportTicketSchema),
    SupportController.createSupportTicket
);

router.get(
    '/all',
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    SupportController.getAllSupportTickets
);

router.get(
    '/my-tickets',
    auth(USER_ROLES.SENDER, USER_ROLES.DRIVER),
    SupportController.getMySupportTickets
);

router.patch(
    '/reply/:id',
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    validateRequest(SupportValidation.replySupportTicketSchema),
    SupportController.replyToSupportTicket
);

router.delete(
    '/:id',
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    SupportController.deleteSupportTicket
);

export const SupportRoutes = router;
