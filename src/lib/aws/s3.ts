import { S3Client } from '@aws-sdk/client-s3';

const region = process.env.AWS_REGION;

if (!region) {
  console.warn('AWS_REGION is not set. S3 operations will fail until configured.');
}

export const s3Client = new S3Client({
  region,
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

