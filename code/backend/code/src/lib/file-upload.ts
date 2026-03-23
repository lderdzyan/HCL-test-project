import { FileStorage } from '.';
import config from '../config';
import * as s3 from './aws/s3';
import * as sts from './aws/sts'

export type UploadFileData = {
  tmpFilePath: string;
  newFilePath: string;
  filename: string;
}
export type GetFileData = {
  filePath: string;
  filename: string;
}
export async function getFileFromStorage(data: GetFileData): Promise<string | undefined> {
  switch (config.fileStorage) {
    case FileStorage.S3:
      return await s3.getFromBucket(config.awsConfig!, data);
    default:
      throw new Error('MS_FILE_STORAGE not defined or unknown storage.');
  }
}

export async function getUploadConfig(pid: string) {
  switch (config.fileStorage) {
    case FileStorage.S3:
      return { credentials: await sts.getCredentials(pid), storageInfo: s3.getStorageMetadata(config.awsConfig!), provider: FileStorage.S3 }
    default:
      throw new Error('MS_FILE_STORAGE not defined or unknown storage.');
  }
}
