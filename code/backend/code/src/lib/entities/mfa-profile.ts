import { createId } from '@paralleldrive/cuid2';
import { Entity, currentAt, currentOn } from '../entity';
import * as AWSMfaProfile from '../aws/dynamodb/mfa-profile';
import config from '../../config';

/**
 * {@link Entity}
 * @property {string} secret - is the secret token for TOTP
 * @property {string} personId - is the person ID
 */
export interface MfaProfile extends Entity {
  personId?: string;
  secret?: string;
}

export async function createMfaProfile(mfaProfile: MfaProfile, pid: string): Promise<MfaProfile> {
  mfaProfile.id = mfaProfile.id ?? createId();
  mfaProfile.createdBy = pid;
  mfaProfile.createdAt = currentAt();
  mfaProfile.createdOn = currentOn();
  mfaProfile.updatedBy = mfaProfile.createdBy;
  mfaProfile.updatedAt = mfaProfile.createdAt;
  mfaProfile.updatedOn = mfaProfile.createdOn;

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSMfaProfile.createMfaProfile(config.awsConfig!, mfaProfile);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return mfaProfile;
}
export async function findAllMfaProfilesByPid(pid: string): Promise<MfaProfile[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSMfaProfile.findAllByPid(config.awsConfig!, pid);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function findMfaProfileById(id: string): Promise<MfaProfile | undefined> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSMfaProfile.findById(config.awsConfig!, id);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function findMfaProfileByPersonId(pid: string): Promise<MfaProfile | undefined> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSMfaProfile.findByPersonId(config.awsConfig!, pid);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
