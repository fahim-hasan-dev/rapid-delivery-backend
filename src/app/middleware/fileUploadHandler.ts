import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import multer, { FileFilterCallback } from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import ApiError from '../../errors/ApiError';
import { r2Client } from '../../config/r2';
import config from '../../config';

const fileUploadHandler = () => {
    //file filter
    const filterFilter = (req: Request, file: any, cb: FileFilterCallback) => {
        if (file.fieldname === 'image') {
            if (
                file.mimetype === 'image/jpeg' ||
                file.mimetype === 'image/png' ||
                file.mimetype === 'image/jpg'
            ) {
                cb(null, true);
            } else {
                cb(new ApiError(StatusCodes.BAD_REQUEST, 'Only .jpeg, .png, .jpg file supported'))
            }
        } else if (file.fieldname === 'media') {
            if (
                file.mimetype === 'image/jpeg' ||
                file.mimetype === 'image/png' ||
                file.mimetype === 'image/jpg'
            ) {
                cb(null, true);
            } else {
                cb(new ApiError(StatusCodes.BAD_REQUEST, 'Only .png file supported'))
            }
        } else {
            cb(new ApiError(StatusCodes.BAD_REQUEST, 'This file is not supported'))
        }
    };

    const upload = multer({
        storage: multerS3({
            s3: r2Client,
            bucket: config.cloudflare.bucketName as string,
            contentType: (_req, file, cb) => {
                cb(null, file.mimetype);
            },
            key: (req, file, cb) => {
                const folder = file.fieldname;
                const extension = path.extname(file.originalname);
                const filename = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}${extension}`;
                cb(null, filename);
            },
        }),
        fileFilter: filterFilter
    }).fields([
        { name: 'image', maxCount: 3 },
        { name: 'media', maxCount: 2 },
    ]);

    return upload;
};

export default fileUploadHandler;
