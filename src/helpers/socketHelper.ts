import { Server, Socket } from 'socket.io';
import { Secret } from 'jsonwebtoken';
import { jwtHelper } from './jwtHelper';
import { trackingService } from './trackingService';
import { logger } from '../shared/logger';
import config from '../config';

const authenticateSocket = (socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth?.token;
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
            lng: number;
            heading?: number;
            speed?: number;
        }) => {
            const { parcelId, lat, lng, heading, speed } = data;

            // Ensure driver is in the specific parcel room for broadcasting
            socket.join(`parcel:${parcelId}`);

            // Save location to Redis for persistence/initial user load
            await trackingService.updateDriverLocation(
                parcelId,
                user.authId,
                [lat, lng]
            );

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
        socket.on('user:track-parcel', async (data: { parcelId: string }) => {
            const { parcelId } = data;
            socket.join(`parcel:${parcelId}`);

            // Send last known location immediately ot user
            const location = await trackingService.getDriverLocation(parcelId);
            if (location) {
                socket.emit('location:updated', location);
            }
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
        socket.join(`user:${user.authId}`);

        socket.on('disconnect', () => {
            socket.leave(`user:${user.authId}`);
        });
    });
};

export const socketHelper = {
    socket: (io: Server) => {
        setupTrackingNamespace(io);
        setupNotificationNamespace(io);
        logger.info('Socket.io namespaces initialized: /tracking, /notifications');
    },
};
