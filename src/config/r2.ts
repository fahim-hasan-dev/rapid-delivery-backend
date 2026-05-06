import { S3Client } from "@aws-sdk/client-s3";
import config from "./index";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${config.cloudflare.accountId}.eu.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.cloudflare.accessKeyId as string,
    secretAccessKey: config.cloudflare.secretAccessKey as string,
  },
});
