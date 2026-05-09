"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_status_codes_1 = require("http-status-codes");
const morgan_1 = require("./shared/morgan");
const routes_1 = __importDefault(require("./app/routes"));
const globalErrorHandler_1 = __importDefault(require("./app/middleware/globalErrorHandler"));
const request_ip_1 = __importDefault(require("request-ip"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const ApiError_1 = __importDefault(require("./errors/ApiError"));
const app = (0, express_1.default)();
// Security middleware to prevent brute-force attacks by limiting requests
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        if (!req.clientIp) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Unable to determine client IP!');
        }
        return req.clientIp;
    },
    handler: (req, res, next, options) => {
        throw new ApiError_1.default(options === null || options === void 0 ? void 0 : options.statusCode, `Rate limit exceeded. Try again in ${options.windowMs / 60000} minutes.`);
    }
});
// Configure request logging with Morgan
app.use(morgan_1.Morgan.successHandler);
app.use(morgan_1.Morgan.errorHandler);
// Parse incoming requests and enable cross-origin support
app.use((0, cors_1.default)());
app.use('/api/v1/webhook', express_1.default.raw({ type: 'application/json' }));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(request_ip_1.default.mw());
// Serve uploaded media and documents statically
app.use(express_1.default.static('uploads'));
// Define the main API entry point
app.use('/api/v1', routes_1.default);
// Root path handler with a welcoming UI for the Rapid-Delivery API
app.get("/", (req, res) => {
    res.send(`
    <body style="margin: 0; padding: 0;">
        <div style="background: #FEF5F0; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <h1 style="color: #FF4A00; font-size: 3rem; margin-bottom: 10px; text-shadow: 0 4px 10px rgba(255, 74, 0, 0.2);">🚀 Welcome to Rapid-Delivery! 🚚</h1>
            <p style="color: #4D1600; font-size: 1.2rem; max-width: 600px; text-align: center; line-height: 1.6;">
                The fastest and most reliable delivery service. Our backend API is up and running smoothly.
            </p>
            <div style="border-top: 2px solid rgba(255, 74, 0, 0.3); width: 80px; margin: 30px 0;"></div>
            <p style="color: #662400; font-size: 0.95rem;">
                Powered by <strong style="color: #FF4A00;">Rapid-Delivery</strong> API ✨
            </p>
        </div>
    </body>
    `);
});
// Centralized error handling for the entire application
app.use(globalErrorHandler_1.default);
// Default handler for undefined API routes
app.use((req, res) => {
    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Not Found",
        errorMessages: [
            {
                path: req.originalUrl,
                message: "API DOESN'T EXIST"
            }
        ]
    });
});
exports.default = app;
