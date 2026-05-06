import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from '../config/r2';
import config from '../config';
import { logger } from './logger';

export const deleteFromR2 = async (filePath: string): Promise<boolean> => {
  try {
    if (!filePath) return false;

    let key = filePath;
    if (key.startsWith('/')) {
      key = key.substring(1);
    }
    
    if (config.cloudflare.publicUrl && key.includes(config.cloudflare.publicUrl)) {
        key = key.replace(config.cloudflare.publicUrl + '/', '');
    }

    const command = new DeleteObjectCommand({
      Bucket: config.cloudflare.bucketName as string,
      Key: key,
    });

    await r2Client.send(command);
    logger.info(`Successfully deleted ${key} from R2`);
    return true;
  } catch (error) {
    logger.error(`Failed to delete file from R2: ${filePath}`, error);
    return false;
  }
};
