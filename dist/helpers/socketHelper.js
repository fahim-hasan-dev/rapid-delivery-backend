"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketHelper = void 0;
const jwtHelper_1 = require("./jwtHelper");
const trackingService_1 = require("./trackingService");
const logger_1 = require("../shared/logger");
const config_1 = __importDefault(require("../config"));
const authenticateSocket = (socket, next) => {
    var _a;
    const token = (_a = socket.handshake.auth) === null || _a === void 0 ? void 0 : _a.token;
    if (!token) {
        return next(new Error('Authentication token required'));
    }
    try {
        const decoded = jwtHelper_1.jwtHelper.verifyToken(token, config_1.default.jwt.jwt_secret);
        socket.data.user = decoded;
        next();
    }
    catch (_b) {
        next(new Error('Invalid or expired token'));
    }
};
const setupTrackingNamespace = (io) => {
    const tracking = io.of('/tracking');
    tracking.use(authenticateSocket);
    tracking.on('connection', (socket) => {
        const user = socket.data.user;
        logger_1.logger.info(`Tracking: ${user.role} ${user.authId} connected`);
        // 1. Driver sends location updates 
        socket.on('driver:location-update', async (data) => {
            const { parcelId, lat, lng, heading, speed } = data;
            // Ensure driver is in the specific parcel room for broadcasting
            socket.join(`parcel:${parcelId}`);
            // Save location to Redis for persistence/initial user load
            await trackingService_1.trackingService.updateDriverLocation(parcelId, user.authId, [lat, lng]);
            // Broadcast movement to all users (including the driver) tracking this parcel
            tracking.to(`parcel:${parcelId}`).emit('location:updated', {
                lat,
                lng,
                heading: heading || 0,
                speed: speed || 0,
                timestamp: Date.now(),
            });
        });
        // 2. User starts tracking a parcel
        socket.on('user:track-parcel', async (data) => {
            const { parcelId } = data;
            socket.join(`parcel:${parcelId}`);
            // Send last known location immediately ot user
            const location = await trackingService_1.trackingService.getDriverLocation(parcelId);
            if (location) {
                socket.emit('location:updated', location);
            }
        });
        socket.on('disconnect', () => {
            logger_1.logger.info(`Tracking: ${user.role} ${user.authId} disconnected`);
        });
    });
};
const setupNotificationNamespace = (io) => {
    const notifications = io.of('/notifications');
    notifications.use(authenticateSocket);
    notifications.on('connection', (socket) => {
        const user = socket.data.user;
        socket.join(`user:${user.authId}`);
        socket.on('disconnect', () => {
            socket.leave(`user:${user.authId}`);
        });
    });
};
const setupChatNamespace = (io) => {
    const chat = io.of('/chat');
    chat.use(authenticateSocket);
    chat.on('connection', (socket) => {
        const user = socket.data.user;
        logger_1.logger.info(`Chat: User ${user.authId} connected`);
        // Join a specific chat room
        socket.on('join-chat', (chatId) => {
            socket.join(chatId);
            logger_1.logger.info(`User ${user.authId} joined chat: ${chatId}`);
        });
        // Leave a chat room
        socket.on('leave-chat', (chatId) => {
            socket.leave(chatId);
            logger_1.logger.info(`User ${user.authId} left chat: ${chatId}`);
        });
        socket.on('disconnect', () => {
            logger_1.logger.info(`Chat: User ${user.authId} disconnected`);
        });
    });
};
exports.socketHelper = {
    socket: (io) => {
        setupTrackingNamespace(io);
        setupNotificationNamespace(io);
        setupChatNamespace(io);
        logger_1.logger.info('Socket.io namespaces initialized: /tracking, /notifications, /chat');
    },
};
