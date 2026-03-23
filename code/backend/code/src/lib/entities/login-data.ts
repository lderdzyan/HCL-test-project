import { createId } from '@paralleldrive/cuid2';
import config from '../../config';
import { LoginStatus } from '../constants';
import { Entity, currentAt, currentOn } from '../entity';
import * as AWSLoginData from '../aws/dynamodb/login-data';

/**
 * {@link Entity}
 * @property {string} status - (_attr1_)
 * @property {number} personId - (_attr2_)
 * @property {number} identity
 */
export interface LoginData extends Entity {
  status: LoginStatus;
  personId?: string;
  identity: string;
}
export async function createLoginData(data: LoginData, pid: string): Promise<LoginData> {
  data.id = data.id ?? createId();
  data.createdBy = pid;
  data.createdAt = currentAt();
  data.createdOn = currentOn();
  data.updatedBy = data.createdBy;
  data.updatedAt = data.createdAt;
  data.updatedOn = data.createdOn;

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSLoginData.create(config.awsConfig!, data);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
  
  return data;
}
