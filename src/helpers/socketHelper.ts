import { Server, Socket } from 'socket.io';
import { Secret } from 'jsonwebtoken';
import { jwtHelper } from './jwtHelper';
import { trackingService } from './trackingService';
import { logger } from '../shared/logger';
import config from '../config';
import { USER_ROLES } from '../enum/user';

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

const handleDriverLocationUpdate = async (
    user: any,
    socket: Socket,
    trackingNamespace: any,
    data: { lat: number; lng: number; parcelId?: string }
) => {
    const { parcelId, lat, lng } = data || {};
    if (!lat || !lng) return;

    if (user.role === USER_ROLES.DRIVER) {
        await trackingService.updateDriverLiveLocation(user.authId, [lng, lat]);
    }

    if (parcelId && trackingNamespace) {
        socket.join(`parcel:${parcelId}`);

        await trackingService.updateDriverLocation(
            parcelId,
            user.authId,
            [lng, lat]
        );

        trackingNamespace.to(`parcel:${parcelId}`).emit('location:updated', {
            lat,
            lng,
            timestamp: Date.now(),
        });
    }
};

const setupTrackingNamespace = (io: Server) => {
    const tracking = io.of('/tracking');
    tracking.use(authenticateSocket);

    tracking.on('connection', (socket) => {
        const user = socket.data.user;
        logger.info(`Tracking: ${user.role} ${user.authId} connected`);
        socket.join(`user:${user.authId}`);

        socket.on('driver:location-update', (data: { lat: number; lng: number; parcelId?: string }) => {
            return handleDriverLocationUpdate(user, socket, tracking, data);
        });

        socket.on('driver:offline', async () => {
            if (user.role === USER_ROLES.DRIVER) {
                await trackingService.removeDriverLiveLocation(user.authId);
            }
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

        socket.on('disconnect', async () => {
            logger.info(`Tracking: ${user.role} ${user.authId} disconnected`);
            if (user.role === USER_ROLES.DRIVER) {
                await trackingService.removeDriverLiveLocation(user.authId);
            }
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

        socket.on('driver:location-update', (data: { lat: number; lng: number; parcelId?: string }) => {
            return handleDriverLocationUpdate(user, socket, io.of('/tracking'), data);
        });

        socket.on('driver:offline', async () => {
            if (user.role === USER_ROLES.DRIVER) {
                await trackingService.removeDriverLiveLocation(user.authId);
            }
        });

        socket.on('disconnect', async () => {
            logger.info(`Notification: ${user.role} ${user.authId} disconnected`);
            if (user.role === USER_ROLES.DRIVER) {
                await trackingService.removeDriverLiveLocation(user.authId);
            }
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
