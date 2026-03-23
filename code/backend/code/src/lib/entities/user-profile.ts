import { createId } from '@paralleldrive/cuid2';
import config from '../../config';
import * as AWSUserProfile from '../aws/dynamodb/user-profile';
import { Entity, currentAt, currentOn } from '../entity';
import { EMAIL_REGEXP, RegistrationSource, UserType } from '../constants';

/**
 * {@link Entity}
 * @property {string} username - person user profile username
 * @property {string} email - user profile email address
 * @property {string} pwd - user password
 * @property {string} pwdSecret - secret token to verify password
 * @property {string} country - user's country code
 * @property {boolean} marketing - shows user subscription status
 * @property {string} personId - PID of the person that belongs to user profile
 * @property {boolean} mfaOptout - shows user MFA output status
 * @property {boolean} msWebAdmin - show is user web admin or not
 * @property {UserType[]} userTypes - user types
 * @property {number} countrySetDate - date when user set his country
 * @property {number} mfaOptoutSetDate - date when user set his mfaOptout
 */
export interface UserProfile extends Entity {
  username?: string;
  personId: string;
  userTypes?: UserType[];
  email?: string;
  pwd?: string;
  pwdSecret?: string;
  country?: string;
  marketing?: boolean;
  mfaOptout?: boolean;
  msWebAdmin?: boolean;
  countrySetDate?: number;
  mfaOptoutSetDate?: number;
  isB2b2c?: boolean;
  registrationSource?: RegistrationSource;
}

export async function createUserProfile(userProfile: UserProfile, pid: string): Promise<UserProfile> {
  userProfile.id = userProfile.id ?? createId();
  userProfile.mfaOptout = false;
  userProfile.msWebAdmin = false;
  userProfile.createdBy = pid;
  userProfile.createdAt = currentAt();
  userProfile.createdOn = currentOn();
  userProfile.updatedBy = userProfile.createdBy;
  userProfile.updatedAt = userProfile.createdAt;
  userProfile.updatedOn = userProfile.createdOn;

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSUserProfile.createUserProfile(config.awsConfig!, userProfile);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return userProfile;
}

export async function findUserByIdentity(identity: string): Promise<UserProfile | undefined> {
  switch (config.deploymenEnv) {
    case 'aws': {
      if (EMAIL_REGEXP.test(identity)) {
        return AWSUserProfile.findByEmail(config.awsConfig!, identity);
      } else {
        return AWSUserProfile.findByUsername(config.awsConfig!, identity);
      }
    }
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function findAllUsersByPid(pid: string): Promise<UserProfile[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSUserProfile.findAllByPid(config.awsConfig!, pid);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function findAllUsersByPidAndEmail(pid: string, email: string): Promise<UserProfile[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSUserProfile.findAllByPidAndEmail(config.awsConfig!, pid, email);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function findAllUsersByEmail(email: string): Promise<UserProfile[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSUserProfile.findAllByEmail(config.awsConfig!, email);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function loadAllUsers(): Promise<UserProfile[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSUserProfile.loadAll(config.awsConfig!);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}

async function countUsernameBeginsWith(prefix: string): Promise<number> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSUserProfile.countUsernameBeginsWith(config.awsConfig!, prefix);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function generateUsername(firstName?: string, lastName?: string): Promise<string | undefined> {
  if (firstName == null || lastName == null) return undefined;
  const draftUsername = (firstName.charAt(0).toLowerCase() + lastName.toLowerCase()).replace(/\s+/g, '');
  const count = await countUsernameBeginsWith(draftUsername);
  return `${draftUsername}${count + 1}`;
}
export async function setUserMfaOptout(user: UserProfile, pid: string): Promise<UserProfile> {
  if (user.id == null) throw Error('UserProfile must have `id`.');

  user.updatedBy = pid;
  user.updatedOn = currentOn();
  user.updatedAt = currentAt();

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSUserProfile.updateMfaOptout(config.awsConfig!, user);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return user;
}
export async function setUserPassword(user: UserProfile, pid: string): Promise<UserProfile> {
  if (user.id == null) throw Error('UserProfile must have `id`.');

  user.updatedBy = pid;
  user.updatedOn = currentOn();
  user.updatedAt = currentAt();

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSUserProfile.updatePassword(config.awsConfig!, user);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return user;
}
export async function setUserPasswordSecret(user: UserProfile, pid: string): Promise<UserProfile> {
  if (user.id == null) throw Error('UserProfile must have `id`.');

  user.updatedBy = pid;
  user.updatedOn = currentOn();
  user.updatedAt = currentAt();

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSUserProfile.updatePasswordSecret(config.awsConfig!, user);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return user;
}
export async function updateUserProfile(user: UserProfile, pid: string): Promise<UserProfile> {
  if (user.id == null) throw Error('UserProfile must have `id`.');

  user.updatedBy = pid;
  user.updatedOn = currentOn();
  user.updatedAt = currentAt();

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSUserProfile.update(config.awsConfig!, user);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return user;
}
