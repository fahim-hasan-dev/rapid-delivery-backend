import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { ParcelServices } from "./parcel.service";
import { JwtPayload } from "jsonwebtoken";

const createParcel = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const result = await ParcelServices.createParcel({
        ...req.body,
        sender: user.authId,
    });

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: "Parcel created successfully",
        data: result,
    });
});

const getAllParcels = catchAsync(async (req: Request, res: Response) => {
    const result = await ParcelServices.getAllParcels(req.query);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Parcels fetched successfully",
        data: result,
    });
});

const getSingleParcel = catchAsync(async (req: Request, res: Response) => {
    const result = await ParcelServices.getSingleParcel(req.params.id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Parcel fetched successfully",
        data: result,
    });
});

const updateParcel = catchAsync(async (req: Request, res: Response) => {
    const result = await ParcelServices.updateParcel(req.params.id, req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Parcel updated successfully",
        data: result,
    });
});

const deleteParcel = catchAsync(async (req: Request, res: Response) => {
    await ParcelServices.deleteParcel(req.params.id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Parcel deleted successfully",
    });
});

export const ParcelController = {
    createParcel,
    getAllParcels,
    getSingleParcel,
    updateParcel,
    deleteParcel,
};
