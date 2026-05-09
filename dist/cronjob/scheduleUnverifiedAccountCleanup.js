"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleUnverifiedAccountCleanup = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../helpers/redis");
const user_model_1 = require("../app/modules/user/user.model");
const logger_1 = require("../shared/logger");
const connection = (0, redis_1.getRedisConnection)();
const cleanupQueue = new bullmq_1.Queue('account-cleanup', { connection });
const scheduleUnverifiedAccountCleanup = async () => {
    await cleanupQueue.add('cleanup-unverified', {}, {
        repeat: { pattern: '* * * * *' },
        removeOnComplete: true,
        removeOnFail: 50,
    });
    new bullmq_1.Worker('account-cleanup', async () => {
        const GRACE_PERIOD_MINUTES = 5;
        const cutoffDate = new Date(Date.now() - GRACE_PERIOD_MINUTES * 60 * 1000);
        const result = await user_model_1.User.deleteMany({
            isEmailVerified: false,
            createdAt: { $lt: cutoffDate },
        });
        if (result.deletedCount > 0) {
            logger_1.logger.info(`Deleted ${result.deletedCount} unverified accounts.`);
        }
    }, { connection, concurrency: 1 });
    logger_1.logger.info('Unverified account cleanup job scheduled via BullMQ.');
};
exports.scheduleUnverifiedAccountCleanup = scheduleUnverifiedAccountCleanup;
