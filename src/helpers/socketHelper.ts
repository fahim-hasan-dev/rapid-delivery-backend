import { Server, Socket } from 'socket.io';
import { Secret } from 'jsonwebtoken';
import { jwtHelper } from './jwtHelper';
import { trackingService } from './trackingService';
import { logger } from '../shared/logger';
import config from '../config';

const authenticateSocket = (socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers.token;
    if (!token) {
        return next(new Error('Authentication token required'));
    }

    try {
        const decoded = jwtHelper.verifyToken(token, config.jwt.jwt_secret as Secret);
        socket.data.user = decoded;
        next();
    } catch {
        next(new Error('Invalid or expired token'));
    }
};

const setupTrackingNamespace = (io: Server) => {
    const tracking = io.of('/tracking');
    tracking.use(authenticateSocket);

    tracking.on('connection', (socket) => {
        const user = socket.data.user;
        logger.info(`Tracking: ${user.role} ${user.authId} connected`);

        // 1. Driver sends location updates 
        socket.on('driver:location-update', async (data: {
            parcelId: string;
            lat: number;
            lng: number
        }) => {


            const { parcelId, lat, lng } = data;


            // Ensure driver is in the specific parcel room for broadcasting
            socket.join(`parcel:${parcelId}`);

            // Save location to Redis for persistence/initial user load
            await trackingService.updateDriverLocation(
                parcelId,
                user.authId,
                [lng, lat]
            );

            // Broadcast movement to all users (including the driver) tracking this parcel
            tracking.to(`parcel:${parcelId}`).emit('location:updated', {
                lat,
                lng,
                timestamp: Date.now(),
            });
        });

        // 2. User starts tracking a parcel
        socket.on('user:track-parcel', async (data: { parcelId: string }) => {
            const { parcelId } = data;
            socket.join(`parcel:${parcelId}`);

            // Send last known location immediately ot user
            const location = await trackingService.getDriverLocation(parcelId);
            if (location) {
                socket.emit('location:updated', location);
            }
        });

        // 3. User stops tracking a parcel
        socket.on('user:untrack-parcel', (data: { parcelId: string }) => {
            const { parcelId } = data;
            socket.leave(`parcel:${parcelId}`);
            logger.info(`User ${user.authId} stopped tracking parcel: ${parcelId}`);
        });

        socket.on('disconnect', () => {
            logger.info(`Tracking: ${user.role} ${user.authId} disconnected`);
        });
    });
};

const setupNotificationNamespace = (io: Server) => {
    const notifications = io.of('/notifications');
    notifications.use(authenticateSocket);

    notifications.on('connection', (socket) => {
        const user = socket.data.user;
        logger.info(`Notification: ${user.role} ${user.authId} connected`);
        socket.join(`user:${user.authId}`);

        socket.on('disconnect', () => {
            logger.info(`Notification: ${user.role} ${user.authId} disconnected`);
            socket.leave(`user:${user.authId}`);
        });
    });
};

const setupChatNamespace = (io: Server) => {
    const chat = io.of('/chat');
    chat.use(authenticateSocket);

    chat.on('connection', (socket) => {
        const user = socket.data.user;
        logger.info(`Chat: User ${user.authId} connected`);

        // Join a specific chat room
        socket.on('join-chat', (chatId: string) => {
            socket.join(chatId);
            logger.info(`User ${user.authId} joined chat: ${chatId}`);
        });

        // Leave a chat room
        socket.on('leave-chat', (chatId: string) => {
            socket.leave(chatId);
            logger.info(`User ${user.authId} left chat: ${chatId}`);
        });

        socket.on('disconnect', () => {
            logger.info(`Chat: User ${user.authId} disconnected`);
        });
    });
};

export const socketHelper = {
    socket: (io: Server) => {
        setupTrackingNamespace(io);
        setupNotificationNamespace(io);
        setupChatNamespace(io);
        logger.info('Socket.io namespaces initialized: /tracking, /notifications, /chat');
    },
};
