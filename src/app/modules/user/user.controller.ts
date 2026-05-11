import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { UserServices } from './user.service'
import { IUser } from './user.interface'
import { JwtPayload } from 'jsonwebtoken'


const getAllUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.getAllUser(req.query)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User fetched successfully',
    data: { ...result },
  })
})

const getNewDriverRequests = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.getNewDriverRequests(req.query)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Driver requests list fetched successfully',
    data: { ...result },
  })
})

const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.getSingleUser(req.params.id)
  sendResponse<IUser>(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User fetched successfully',
    data: result,
  })
})

// Update Profile
const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.updateProfile(req.user! as JwtPayload, req.body)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Profile updated successfully',
    data: result
  })
})

const resubmitProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.resubmitProfile(req.user! as JwtPayload, req.body)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Profile resubmitted successfully',
    data: result
  })
})

const verifyProfileByAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.verifyProfileByAdmin(req.params.id, req.body)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Profile status updated successfully',
    data: result
  })
})

const suspendAndReactivedUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.suspendAndReactivedUser(req.params.id)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User status updated successfully',
    data: result
  })
})

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.deleteUser(req.params.id)
  sendResponse<IUser>(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User deleted successfully',
  })
})

const getProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.getProfile(req.user! as JwtPayload)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Profile fetched successfully',
    data: result,
  })
})

const deleteMyAccount = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.deleteMyAccount(req.user! as JwtPayload)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Account deleted successfully",
  })
})



export const UserController = {
  getAllUser,
  updateProfile,
  getSingleUser,
  getNewDriverRequests,
  deleteUser,
  getProfile,
  deleteMyAccount,
  resubmitProfile,
  verifyProfileByAdmin,
  suspendAndReactivedUser
}
