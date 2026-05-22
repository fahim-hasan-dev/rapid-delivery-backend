import { Worker } from 'bullmq';
import { getRedisConnection } from '../helpers/redis';
import { User } from '../app/modules/user/user.model';
import { logger } from '../shared/logger';

const connection = getRedisConnection();

const userCleanupWorker = new Worker(
  'userCleanup',
  async (job) => {
    const { userId } = job.data;

    // Find the user by ID
    const user = await User.findById(userId);

    // If the user does not exist, do nothing
    if (!user) {
      return;
    }

    // If the user's email remains unverified, delete the account
    if (!user.isEmailVerified) {
      await User.findByIdAndDelete(userId);
      logger.info(`🗑️ Unverified user ${userId} (${user.email}) successfully deleted after 1 hour.`);
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

userCleanupWorker.on('failed', (job, err) => {
  logger.error(`User cleanup job ${job?.id} failed:`, err);
});

export default userCleanupWorker;
