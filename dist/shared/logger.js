"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorLogger = exports.logger = void 0;
const path_1 = __importDefault(require("path"));
const winston_1 = require("winston");
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const fs_1 = __importDefault(require("fs"));
// Ensure log directories exist before attempting to write logs
const createLogDirs = () => {
    const dirs = ['logs/winston/successes', 'logs/winston/errors'];
    dirs.forEach(dir => {
        if (!fs_1.default.existsSync(path_1.default.join(process.cwd(), dir))) {
            fs_1.default.mkdirSync(path_1.default.join(process.cwd(), dir), { recursive: true });
        }
    });
};
const { combine, timestamp, label, printf } = winston_1.format;
// Define the structure and layout of the log messages
const myFormat = printf((info) => {
    const { level, message, label, timestamp } = info;
    const date = new Date(timestamp);
    const hour = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `{${date.toDateString()} ${hour}:${minutes}:${seconds}} [${label}] ${level}: ${message}`;
});
createLogDirs();
// Standard info logger for general system events and successes
const logger = (0, winston_1.createLogger)({
    level: 'info',
    format: combine(label({ label: 'Rapid-Delivery 🚚' }), timestamp(), myFormat),
    transports: [
        new winston_1.transports.Console(),
        new winston_daily_rotate_file_1.default({
            filename: path_1.default.join(process.cwd(), 'logs', 'winston', 'successes', 'sg-%DATE%-success.log'),
            datePattern: 'YYYY-MM-DD-HH',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
        }),
    ],
});
exports.logger = logger;
// Specialized error logger for tracking exceptions and failures
const errorLogger = (0, winston_1.createLogger)({
    level: 'error',
    format: combine(label({ label: 'Rapid-Delivery 🚨' }), timestamp(), myFormat),
    transports: [
        new winston_1.transports.Console(),
        new winston_daily_rotate_file_1.default({
            filename: path_1.default.join(process.cwd(), 'logs', 'winston', 'errors', 'sg-%DATE%-error.log'),
            datePattern: 'YYYY-MM-DD-HH',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
        }),
    ],
});
exports.errorLogger = errorLogger;
