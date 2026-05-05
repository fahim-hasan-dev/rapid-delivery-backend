import { logger } from '../shared/logger';
import notificationWorker from './notification.worker';

export const initWorkers = () => {
    notificationWorker.on('ready', () => logger.info('🔔 Notification worker ready'));
};
