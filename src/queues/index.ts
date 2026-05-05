import { Queue } from 'bullmq';
import { getRedisConnection } from '../helpers/redis';

const connection = getRedisConnection();

export const notificationQueue = new Queue('notification', { connection });
