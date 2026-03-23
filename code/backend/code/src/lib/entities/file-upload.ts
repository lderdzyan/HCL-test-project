import config from '../../config';
import { createId } from '@paralleldrive/cuid2';
import { FileUploadTypes } from '../constants';
import { Entity, currentAt, currentOn } from '../entity';
import * as AWSFileUpload from '../aws/dynamodb/file-upload';
import { Option } from 'fp-ts/lib/Option';

/**
 * {@link Entity}
 * @property {string} personId
 * @property {string} type - (_attr_1)
 * @property {string} fileName
 */
export interface FileUpload extends Entity {
  type: FileUploadTypes;
  fileName: string;
  personId: string;
  duration?: number;
}

export async function createFileUpload(file: FileUpload): Promise<FileUpload> {
  file.id = file.id ?? createId();
  file.createdBy = file.personId;
  file.createdAt = currentAt();
  file.createdOn = currentOn();
  file.updatedBy = file.createdBy;
  file.updatedAt = file.createdAt;
  file.updatedOn = file.createdOn;

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSFileUpload.createFileUpload(config.awsConfig!, file);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return file;
}
export async function getFileUploadById(id: string): Promise<Option<FileUpload>> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSFileUpload.findById(config.awsConfig!, id);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function getAllFilesByType(type: FileUploadTypes): Promise<FileUpload[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSFileUpload.getAllFilesByType(config.awsConfig!, type);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function updateFileUplaod(fileUpload: FileUpload, pid: string, fieldsToUpdate: string[]) {
  if (fileUpload.id == null) throw Error('fileUpload must have `id`.');

  fileUpload.updatedBy = pid;
  fileUpload.updatedOn = currentOn();
  fileUpload.updatedAt = currentAt();

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSFileUpload.updateFileUpload(config.awsConfig!, fileUpload, fieldsToUpdate);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return fileUpload;
}
