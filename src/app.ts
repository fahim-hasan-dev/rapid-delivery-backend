import express, { Request, Response } from "express";
import cors from "cors";
import { StatusCodes } from "http-status-codes";
import { Morgan } from "./shared/morgan";
import router from './app/routes';
import globalErrorHandler from './app/middleware/globalErrorHandler';
import requestIp from 'request-ip';
import rateLimit from 'express-rate-limit';
import ApiError from "./errors/ApiError";

const app = express();

// Security middleware to prevent brute-force attacks by limiting requests
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        if (!req.clientIp) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Unable to determine client IP!');
        }
        return req.clientIp;
    },
    handler: (req, res, next, options) => {
        throw new ApiError(options?.statusCode, `Rate limit exceeded. Try again in ${options.windowMs / 60000} minutes.`);
    }
});

// Configure request logging with Morgan
app.use(Morgan.successHandler);
app.use(Morgan.errorHandler);

// Parse incoming requests and enable cross-origin support
app.use(cors());
app.use('/api/v1/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestIp.mw());

// Serve uploaded media and documents statically
app.use(express.static('uploads'));

// Define the main API entry point
app.use('/api/v1', router);

// Root path handler with a welcoming UI for the Rapid-Delivery API
app.get("/", (req: Request, res: Response) => {
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
})

// Centralized error handling for the entire application
app.use(globalErrorHandler);

// Default handler for undefined API routes
app.use((req: Request, res: Response) => {
    res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Not Found",
        errorMessages: [
            {
                path: req.originalUrl,
                message: "API DOESN'T EXIST"
            }
        ]
    })
});

export default app;


