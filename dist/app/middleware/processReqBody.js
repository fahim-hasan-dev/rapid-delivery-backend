"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileAndBodyProcessorUsingDiskStorage = void 0;
const multer_1 = __importDefault(require("multer"));
const multer_s3_1 = __importDefault(require("multer-s3"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
const path = __importStar(require("path"));
const r2_1 = require("../../config/r2");
const config_1 = __importDefault(require("../../config"));
const uploadFields = [
    { name: 'image', maxCount: 1 },
    { name: 'pickupProof', maxCount: 5 },
    { name: 'deliveryProof', maxCount: 5 },
    { name: 'files', maxCount: 10 },
    { name: 'nid', maxCount: 2 },
    { name: 'drivingLicense', maxCount: 2 },
];
const fileAndBodyProcessorUsingDiskStorage = () => {
    const upload = (0, multer_1.default)({
        storage: (0, multer_s3_1.default)({
            s3: r2_1.r2Client,
            bucket: config_1.default.cloudflare.bucketName,
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
        fileFilter: (req, file, cb) => {
            var _a;
            try {
                const allowedTypes = {
                    image: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/heic', 'image/heif'],
                    pickupProof: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/heic', 'image/heif'],
                    deliveryProof: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/heic', 'image/heif'],
                    nid: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'],
                    drivingLicense: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'],
                    files: [
                        'image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/heic', 'image/heif',
                        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'text/plain'
                    ],
                };
                const fieldType = file.fieldname;
                if (allowedTypes[fieldType] && !((_a = allowedTypes[fieldType]) === null || _a === void 0 ? void 0 : _a.includes(file.mimetype))) {
                    return cb(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Invalid file type for ${file.fieldname}. Supported formats include: JPG, PNG, WEBP, and PDF.`));
                }
                cb(null, true);
            }
            catch (error) {
                cb(new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'File validation failed'));
            }
        },
        limits: { fileSize: 10 * 1024 * 1024, files: 50 },
    }).fields(uploadFields);
    return (req, res, next) => {
        upload(req, res, async (error) => {
            var _a;
            if (error)
                return next(error);
            try {
                if ((_a = req.body) === null || _a === void 0 ? void 0 : _a.data) {
                    req.body = JSON.parse(req.body.data);
                }
                if (!req.files) {
                    return next();
                }
                const processedFiles = {};
                const fieldsConfig = new Map(uploadFields.map((f) => [f.name, f.maxCount]));
                Object.entries(req.files).forEach(([fieldName, files]) => {
                    var _a;
                    const fileArray = files;
                    const maxCount = (_a = fieldsConfig.get(fieldName)) !== null && _a !== void 0 ? _a : 1;
                    const paths = fileArray.map((file) => `${config_1.default.cloudflare.publicUrl}/${file.key}`);
                    processedFiles[fieldName] = maxCount > 1 ? paths : paths[0];
                });
                req.body = {
                    ...req.body,
                    ...processedFiles,
                };
                next();
            }
            catch (err) {
                next(err);
            }
        });
    };
};
exports.fileAndBodyProcessorUsingDiskStorage = fileAndBodyProcessorUsingDiskStorage;
