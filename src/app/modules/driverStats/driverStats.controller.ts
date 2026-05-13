import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { DriverStatsService } from "./driverStats.service";

const getDriverStats = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await DriverStatsService.getDriverStats(id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Driver statistics fetched successfully",
        data: result
    });
});

export const DriverStatsController = {
    getDriverStats
};
