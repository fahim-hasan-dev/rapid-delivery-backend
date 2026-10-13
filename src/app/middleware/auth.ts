import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { Secret } from 'jsonwebtoken'
import config from '../../config'
import { jwtHelper } from '../../helpers/jwtHelper'
import ApiError from '../../errors/ApiError'
import { User } from '../modules/user/user.model'
import { USER_ROLES, PROFILE_VERIFICATION_STATUS } from '../../enum/user'

const auth =
    (...roles: string[]) =>
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const tokenWithBearer = req.headers.authorization


                if (!tokenWithBearer) {
                    throw new ApiError(StatusCodes.NOT_FOUND, 'Token not found!')
                }

                if (tokenWithBearer && tokenWithBearer.startsWith('Bearer')) {
                    const token = tokenWithBearer.split(' ')[1]

                    try {
                        // Verify token
                        const verifyUser = jwtHelper.verifyToken(
                            token,
                            config.jwt.jwt_secret as Secret,
                        )

                        // Set user to header
                        req.user = verifyUser

                        // Guard user
                        if (roles.length && !roles.includes(verifyUser.role)) {
                            throw new ApiError(
                                StatusCodes.FORBIDDEN,
                                "You don't have permission to access this API",
                            )
                        }

                        // Driver specific profile verification guard
                        if (verifyUser.role === USER_ROLES.DRIVER) {
                            const isGetProfile = req.method === 'GET' && req.originalUrl.includes('/user/me');
                            const isResubmitProfile = req.originalUrl.includes('/user/resubmit-profile');
                            const isUpdateProfile = req.method === 'PATCH' && req.originalUrl.includes('/user/profile');
                            
                            if (!isGetProfile && !isResubmitProfile && !isUpdateProfile) {
                                const driver = await User.findById(verifyUser.authId).lean();
                                if (driver?.driverInfo?.profileVerification !== PROFILE_VERIFICATION_STATUS.APPROVED) {
                                    throw new ApiError(
                                        StatusCodes.FORBIDDEN,
                                        "Your profile is not approved yet. You can only access your profile and resubmit documents.",
                                    )
                                }
                            }
                        }

                        next()
                    } catch (error) {
                        if (error instanceof Error && error.name === 'TokenExpiredError') {
                            throw new ApiError(StatusCodes.UNAUTHORIZED, 'Access Token has expired')
                        }
                        next(error)
                    }
                }
            } catch (error) {
                next(error)
            }
        }

export default auth



//this temp auth middleware is created for temporary user verification before creating a new user
//in the future, we will use the auth middleware above

export const tempAuth =
    (...roles: string[]) =>
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const tokenWithBearer = req.headers.authorization
                if (!tokenWithBearer) {
                    throw new ApiError(StatusCodes.NOT_FOUND, 'Token not found!')
                }

                if (!tokenWithBearer.startsWith('Bearer ')) {
                    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid token format')
                }

                const token = tokenWithBearer.split(' ')[1]

                try {
                    // Verify token
                    const verifyUser = jwtHelper.verifyToken(
                        token,
                        config.jwt.temp_jwt_secret as Secret,
                    )

                    // Set user to header
                    req.user = verifyUser

                    // Guard user
                    if (roles.length && !roles.includes(verifyUser.role)) {
                        throw new ApiError(
                            StatusCodes.FORBIDDEN,
                            "You don't have permission to access this API",
                        )
                    }

                    next()
                } catch (error) {
                    if (error instanceof Error && error.name === 'TokenExpiredError') {
                        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Temporary token has expired. Please login again.')
                    }
                    throw new ApiError(StatusCodes.FORBIDDEN, 'Invalid Temporary Token')
                }
            } catch (error) {
                next(error)
            }
        }
