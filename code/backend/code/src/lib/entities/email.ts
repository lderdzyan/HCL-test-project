import { createId } from '@paralleldrive/cuid2';
import { Entity, currentAt, currentOn } from '../entity';
import * as AWSEmail from '../aws/dynamodb/email';
import config from '../../config';

/**
 * {@link Entity}
 * @property {string} emailAddr - email address (_attr1_)
 * @property {string} mfaProfileId - MfaProfile unique ID (_attr2_)
 * @property {boolean} active - email item status
 */
export interface Email extends Entity {
  emailAddr: string;
  mfaProfileId: string;
  active: boolean;
}

export async function createEmail(email: Email, pid: string): Promise<Email> {
  email.id = email.id ?? createId();
  email.createdBy = pid;
  email.createdAt = currentAt();
  email.createdOn = currentOn();
  email.updatedBy = email.createdBy;
  email.updatedAt = email.createdAt;
  email.updatedOn = email.createdOn;

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSEmail.createEmail(config.awsConfig!, email);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return email;
}
export async function findEmailByAddress(email: string): Promise<Email | undefined> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSEmail.findByAddress(config.awsConfig!, email);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function activateEmailItem(email: Email, pid: string) {
  email.active = true;
  email.updatedBy = pid;
  email.updatedAt = currentAt();
  email.updatedOn = currentOn();

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSEmail.activate(config.awsConfig!, email);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function findEmailByMfaProfileId(id: string): Promise<Email | undefined> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSEmail.findByMfaProfileId(config.awsConfig!, id);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function findEmailByAddressAndByMfaProfileId(email: string, id: string): Promise<Email | undefined> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSEmail.findByAddressAndMfaProfileId(config.awsConfig!, email, id);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
