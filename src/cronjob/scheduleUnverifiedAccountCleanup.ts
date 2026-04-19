import cron from "node-cron";
import { User } from "../app/modules/user/user.model";
import { logger } from "../shared/logger";

// Background job to periodically remove unverified accounts
export const scheduleUnverifiedAccountCleanup = () => {
    const GRACE_PERIOD_MINUTES = 5;

    // Run the cleanup process every minute to keep the user database clean
    cron.schedule("* * * * *", async () => {
        try {
            const cutoffDate = new Date(Date.now() - GRACE_PERIOD_MINUTES * 60 * 1000);

            // Find and delete accounts that failed to verify within the grace period
            const result = await User.deleteMany({
                isEmailVerified: false,
                createdAt: { $lt: cutoffDate },
            });

            if (result.deletedCount > 0) {
                logger.info(`Deleted ${result.deletedCount} unverified accounts.`);
            }
        } catch (error) {
            logger.error("Error during unverified account cleanup:", error);
        }
    });

    logger.info("Unverified account cleanup job scheduled.");
};


