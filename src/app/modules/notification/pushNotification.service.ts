import * as admin from 'firebase-admin';
import path from 'path';
import config from '../../../config';
import { logger } from '../../../shared/logger';

// Flag to track initialization status
let isFirebaseInitialized = false;

// Set up firebase admin with service account credentials
const initializeFirebase = () => {
    try {
        let serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');

        if (!require('fs').existsSync(serviceAccountPath)) {
            serviceAccountPath = path.join(process.cwd(), '..', 'serviceAccountKey.json');
        }

        if (admin.apps.length === 0) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccountPath),
            });
            logger.info('Firebase Admin initialized successfully using: ' + serviceAccountPath);
        }

        isFirebaseInitialized = true;
    } catch (error: any) {
        logger.error('Firebase Admin initialization failed:', error);
    }
};

// Send push notifications to one or more devices via FCM
const sendPushNotification = async (
    fcmTokens: string | string[],
    title: string,
    body: string,
    data?: Record<string, any>
) => {
    if (!isFirebaseInitialized) {
        initializeFirebase();
    }

    if (!isFirebaseInitialized) {
        logger.warn('Push notification skipped: Firebase not initialized');
        return;
    }

    // Format tokens into an array for consistent processing
    const tokens = Array.isArray(fcmTokens) ? fcmTokens : [fcmTokens];
    if (tokens.length === 0) return;

    const stringifiedData: Record<string, string> = {};
    if (data) {
        Object.entries(data).forEach(([key, value]) => {
            stringifiedData[key] = value?.toString() || '';
        });
    }

    // Process notification sending for each token
    try {
        const results = await Promise.all(tokens.map(async (token) => {
            const message: admin.messaging.Message = {
                notification: { title, body },
                data: stringifiedData,
                token: token,
            };
            return admin.messaging().send(message);
        }));
        
        logger.info(`Push notifications sent to ${results.length} tokens.`);
        return results;
    } catch (error) {
        logger.error('Error sending push notifications:', error);
    }
};

export const PushNotificationService = {
    sendPushNotification,
};

