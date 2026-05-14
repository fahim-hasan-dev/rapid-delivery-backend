import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { ContactServices } from './contact.service';

const createContact = catchAsync(async (req: Request, res: Response) => {
  const result = await ContactServices.createContact(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Contact form submitted successfully',
    data: result,
  });
});

const getAllContacts = catchAsync(async (req: Request, res: Response) => {
  const result = await ContactServices.getAllContacts(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Contacts retrieved successfully',
    data: result.result,
    meta: result.meta,
  });
});

const getContactById = catchAsync(async (req: Request, res: Response) => {
  const result = await ContactServices.getContactById(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Contact details retrieved successfully',
    data: result,
  });
});

const replyToContact = catchAsync(async (req: Request, res: Response) => {
  const result = await ContactServices.replyToContact(req.params.id, req.body.replyMessage);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Replied to contact query successfully',
    data: result,
  });
});

export const ContactControllers = {
  createContact,
  getAllContacts,
  getContactById,
  replyToContact,
};
