import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { IConfig } from './config';
import * as fs from 'fs';
import { Logger } from '../logger';
import { GetFileData } from '../file-upload';

export async function getFromBucket(config: IConfig, data: GetFileData): Promise<string | undefined> {
  if (config.uploadBucket == null) throw Error('AWS_UPLOAD_BUCKET_NAME not configured.');
  const client = new S3Client({ region: config.region });
  const command = new GetObjectCommand({
    Bucket: config.uploadBucket,
    Key: data.filePath,
  });

  try {
    const response = await client.send(command);

    if (response == null || response.Body == null) {
      return undefined;
    }
    fs.writeFileSync(
      `/tmp/${data.filename}`,
      await response.Body.transformToByteArray()
    );

    if (fs.existsSync(`/tmp/${data.filename}`)) {
      return `/tmp/${data.filename}`;
    }
    return undefined;

  } catch (err) {
    Logger.error(err, 'Error getting file.');
  }
}

export type StorageInfo = {
  region: string;
  bucket: string;
  path?: string;
}

export function getStorageMetadata(config: IConfig) {
  return { bucket: config.uploadBucket, path: 'raw/', region: config.region };
}
