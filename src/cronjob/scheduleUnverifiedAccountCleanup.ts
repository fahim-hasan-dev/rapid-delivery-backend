import { Queue, Worker } from 'bullmq';
import { getRedisConnection } from '../helpers/redis';
import { User } from '../app/modules/user/user.model';
import { logger } from '../shared/logger';

const connection = getRedisConnection();

const cleanupQueue = new Queue('account-cleanup', { connection });

export const scheduleUnverifiedAccountCleanup = async () => {
    await cleanupQueue.add(
        'cleanup-unverified',
        {},
        {
            repeat: { pattern: '* * * * *' },
            removeOnComplete: true,
            removeOnFail: 50,
        }
    );

    new Worker(
        'account-cleanup',
        async () => {
            const GRACE_PERIOD_MINUTES = 5;
            const cutoffDate = new Date(Date.now() - GRACE_PERIOD_MINUTES * 60 * 1000);

            const result = await User.deleteMany({
                isEmailVerified: false,
                createdAt: { $lt: cutoffDate },
            });

            if (result.deletedCount > 0) {
                logger.info(`Deleted ${result.deletedCount} unverified accounts.`);
            }
        },
        { connection, concurrency: 1 }
    );

    logger.info('Unverified account cleanup job scheduled via BullMQ.');
};
