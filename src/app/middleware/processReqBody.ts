import { Request, Response, NextFunction } from 'express'
import multer, { FileFilterCallback } from 'multer'
import multerS3 from 'multer-s3'
import ApiError from '../../errors/ApiError'
import { StatusCodes } from 'http-status-codes'
import * as path from 'path'
import { r2Client } from '../../config/r2'
import config from '../../config'

type IFolderName =
  | 'image'
  | 'pickupProof'
  | 'deliveryProof'
  | 'files'

interface ProcessedFiles {
  [key: string]: string | string[] | undefined
}

const uploadFields = [
  { name: 'image', maxCount: 1 },
  { name: 'pickupProof', maxCount: 5 },
  { name: 'deliveryProof', maxCount: 5 },
  { name: 'files', maxCount: 10 },
] as const

export const fileAndBodyProcessorUsingDiskStorage = () => {
  const upload = multer({
    storage: multerS3({
      s3: r2Client,
      bucket: config.cloudflare.bucketName as string,
      contentType: (_req, file, cb) => {
        cb(null, file.mimetype);
      },
      key: (req, file, cb) => {
        const folder = file.fieldname;
        const extension = path.extname(file.originalname) || `.${file.mimetype.split('/')[1]}`;
        const filename = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}${extension}`;
        cb(null, filename);
      },
    }),
    fileFilter: (
      req: Request,
      file: Express.Multer.File,
      cb: FileFilterCallback,
    ) => {
      try {
        const allowedTypes: Record<string, string[]> = {
          image: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/heic', 'image/heif'],
          pickupProof: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/heic', 'image/heif'],
          deliveryProof: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/heic', 'image/heif'],
          files: [
            'image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/heic', 'image/heif',
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
          ],
        };

        const fieldType = file.fieldname as IFolderName;
        if (allowedTypes[fieldType] && !allowedTypes[fieldType]?.includes(file.mimetype)) {
          return cb(
            new ApiError(
              StatusCodes.BAD_REQUEST,
              `Invalid file type for ${file.fieldname}. Supported: JPG, PNG, WEBP, PDF, DOCX.`,
            ) as any,
          );
        }
        cb(null, true);
      } catch (error) {
        cb(
          new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'File validation failed',
          ) as any,
        );
      }
    },
    limits: { fileSize: 10 * 1024 * 1024, files: 50 },
  }).fields(uploadFields);

  return (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, async (error: any) => {
      if (error) return next(error);

      try {
        if (req.body?.data) {
          req.body = JSON.parse(req.body.data);
        }

        if (!req.files) {
          return next();
        }

        const processedFiles: ProcessedFiles = {};
        const fieldsConfig = new Map(
          uploadFields.map((f) => [f.name, f.maxCount]),
        );

        Object.entries(req.files).forEach(([fieldName, files]) => {
          const fileArray = files as (Express.Multer.File & { key: string })[];
          const maxCount = fieldsConfig.get(fieldName as any) ?? 1;
          const paths = fileArray.map((file) => `${config.cloudflare.publicUrl}/${file.key}`);

          processedFiles[fieldName] = maxCount > 1 ? paths : paths[0];
        });

        req.body = {
          ...req.body,
          ...processedFiles,
        };

        next();
      } catch (err) {
        next(err);
      }
    });
  };
};
