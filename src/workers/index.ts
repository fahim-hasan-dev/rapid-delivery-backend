import { logger } from '../shared/logger';
import notificationWorker from './notification.worker';
import emailWorker from './email.worker';

export const initWorkers = () => {
    notificationWorker.on('ready', () => logger.info('🔔 Notification worker ready'));
    emailWorker.on('ready', () => logger.info('📧 Email worker ready'));
};
