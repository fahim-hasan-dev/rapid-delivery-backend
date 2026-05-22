import { Worker } from 'bullmq';
import { getRedisConnection } from '../helpers/redis';
import { Parcel } from '../app/modules/parcel/parcel.model';
import { PARCEL_STATUS } from '../enum/parcel';
import { logger } from '../shared/logger';

const connection = getRedisConnection();

const parcelCleanupWorker = new Worker(
    'parcelCleanup',
    async (job) => {
        const { parcelId } = job.data;

        // Find the parcel
        const parcel = await Parcel.findById(parcelId);

        // If the parcel does not exist, do nothing
        if (!parcel) {
            return;
        }

        // If it remains unpaid (status is CREATED), delete the parcel
        if (parcel.status === PARCEL_STATUS.CREATED) {
            await Parcel.findByIdAndDelete(parcelId);
            logger.info(`🗑️ Unpaid parcel ${parcelId} successfully deleted after 1 hour.`);
        }
    },
    {
        connection,
        concurrency: 5,
    }
);

parcelCleanupWorker.on('failed', (job, err) => {
    logger.error(`Parcel cleanup job ${job?.id} failed:`, err);
});

export default parcelCleanupWorker;
