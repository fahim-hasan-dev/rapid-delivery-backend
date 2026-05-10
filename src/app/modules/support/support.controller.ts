import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { SupportService } from './support.service';
import { JwtPayload } from 'jsonwebtoken';

const createSupportTicket = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const result = await SupportService.createSupportTicket(user, req.body);
    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: 'Support ticket created successfully',
        data: result
    });
});

const getAllSupportTickets = catchAsync(async (req: Request, res: Response) => {
    const result = await SupportService.getAllSupportTickets(req.query);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Support tickets fetched successfully',
        data: result
    });
});

const getMySupportTickets = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const result = await SupportService.getMySupportTickets(user, req.query);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'My support tickets fetched successfully',
        data: result
    });
});

const replyToSupportTicket = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await SupportService.replyToSupportTicket(id, req.body);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Replied to support ticket successfully',
        data: result
    });
});

const deleteSupportTicket = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await SupportService.deleteSupportTicket(id);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Support ticket deleted successfully'
    });
});

export const SupportController = {
    createSupportTicket,
    getAllSupportTickets,
    getMySupportTickets,
    replyToSupportTicket,
    deleteSupportTicket
};
