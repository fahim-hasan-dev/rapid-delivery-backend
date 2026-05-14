import express from 'express';
import validateRequest from '../../middleware/validateRequest';
import { ContactControllers } from './contact.controller';
import { ContactValidations } from './contact.validation';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enum/user';

const router = express.Router();

router.post(
  '/',
  validateRequest(ContactValidations.createContactSchema),
  ContactControllers.createContact
);

router.get(
  '/',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  ContactControllers.getAllContacts
);

router.get(
  '/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  ContactControllers.getContactById
);

router.patch(
  '/reply/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(ContactValidations.replyContactSchema),
  ContactControllers.replyToContact
);

export const ContactRoutes = router;
