"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const multer_1 = __importDefault(require("multer"));
const multer_s3_1 = __importDefault(require("multer-s3"));
const path_1 = __importDefault(require("path"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const r2_1 = require("../../config/r2");
const config_1 = __importDefault(require("../../config"));
const fileUploadHandler = () => {
    //file filter
    const filterFilter = (req, file, cb) => {
        if (file.fieldname === 'image') {
            if (file.mimetype === 'image/jpeg' ||
                file.mimetype === 'image/png' ||
                file.mimetype === 'image/jpg') {
                cb(null, true);
            }
            else {
                cb(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Only .jpeg, .png, .jpg file supported'));
            }
        }
        else if (file.fieldname === 'media') {
            if (file.mimetype === 'image/jpeg' ||
                file.mimetype === 'image/png' ||
                file.mimetype === 'image/jpg') {
                cb(null, true);
            }
            else {
                cb(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Only .png file supported'));
            }
        }
        else {
            cb(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'This file is not supported'));
        }
    };
    const upload = (0, multer_1.default)({
        storage: (0, multer_s3_1.default)({
            s3: r2_1.r2Client,
            bucket: config_1.default.cloudflare.bucketName,
            contentType: (_req, file, cb) => {
                cb(null, file.mimetype);
            },
            key: (req, file, cb) => {
                const folder = file.fieldname;
                const extension = path_1.default.extname(file.originalname);
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
exports.default = fileUploadHandler;
