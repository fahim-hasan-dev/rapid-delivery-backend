import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IContact } from './contact.interface';
import { Contact } from './contact.model';
import { User } from '../../modules/user/user.model';
import { emailQueue } from '../../../queues';
import QueryBuilder from '../../builder/QueryBuilder';
import { emailTemplate } from '../../../shared/emailTemplate';
import { NotificationService } from '../notification/notification.service';
import { USER_ROLES } from '../../../enum/user';

const createContact = async (payload: IContact) => {
  // Find admin user to send notification
  const admin = await User.findOne({ role: USER_ROLES.SUPER_ADMIN }); // Usually SUPER_ADMIN handles this, or just find any admin

  const result = await Contact.create(payload);
  
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to submit contact form');
  }

  if (admin && admin.email) {
    // send admin email
    await emailQueue.add('send-email', emailTemplate.adminContactNotificationEmail(payload));
    
    // insert in-app notification for admin
    await NotificationService.insertNotification({
      receiver: admin._id,
      title: 'New Contact Query',
      message: `${payload.firstName} ${payload.lastName} has submitted a new contact message.`,
      screen: 'CONTACT_LIST',
      type: admin.role as USER_ROLES
    });
  }

  // send user confirmation email
  await emailQueue.add('send-email', emailTemplate.userContactConfirmationEmail(payload));

  return {
    message: 'Contact form submitted successfully',
  };
};

const getAllContacts = async (query: Record<string, unknown>) => {
  const contactQueryBuilder = new QueryBuilder(Contact.find(), query)
    .search(['firstName', 'lastName', 'email', 'phone', 'subject'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await contactQueryBuilder.modelQuery.lean();
  const meta = await contactQueryBuilder.getPaginationInfo();

  return {
    meta,
    result,
  };
};

const getContactById = async (id: string) => {
  const contact = await Contact.findById(id).lean();
  if (!contact) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Contact record not found');
  }
  return contact;
};

const replyToContact = async (id: string, replyMessage: string) => {
  const contact = await Contact.findById(id);

  if (!contact) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Contact record not found');
  }

  if (contact.isReplied) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'This contact query has already been replied to');
  }

  const updatedContact = await Contact.findByIdAndUpdate(
    id,
    {
      $set: {
        isReplied: true,
        replyMessage: replyMessage,
      },
    },
    { new: true }
  );

  // Queue reply email
  await emailQueue.add('send-email', emailTemplate.contactReplyEmail({
    email: contact.email,
    name: `${contact.firstName} ${contact.lastName}`,
    originalMessage: contact.message,
    replyMessage: replyMessage
  }));

  return updatedContact;
};

export const ContactServices = {
  createContact,
  getAllContacts,
  getContactById,
  replyToContact,
};
