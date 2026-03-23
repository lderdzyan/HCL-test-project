import config from '../../config';
import { createId } from "@paralleldrive/cuid2";
import { Entity, currentAt, currentOn } from "../entity";
import * as AWSGuideProfile from "../aws/dynamodb/guide-profile";
import { Option } from "fp-ts/Option";

/**
 * {@link Entity}
 * @property {string} id - PID of the guide that profile belongs to
 * @property {string} country
 * @property {string} state
 * @property {string} city
 * @property {string[]} languages
 * @property {string[]} workLifeRoles
 * @property {string} profileImage
 * @property {string} welcomeMessage
 * @property {string} experiences
 * @property {string} goodAdvice
 * @property {string} firstName
 * @property {string} lastName
 * @property {@link Highlight} highlights
 * @property {string} deleted
 * @property {string} calendlyUsername
 * @property {string} calendlyUserId
 * @property {string} calendlyEventTypeId
 */
export interface GuideProfile extends Entity {
  country?: string;
  countryState?: string;
  city?: string;
  languages?: string[];
  workLifeRoles?: string[];
  profileImageId?: string;
  welcomeMessageId?: string;
  experiences?: string;
  goodAdvice?: string;
  highlights?: Highlight[];
  firstName?: string;
  lastName?: string;
  deleted: string;
  calendlyUsername?: string;
  calendlyUserId?: string;
  calendlyEventTypeId?: string;
}
export interface IAvailabledDates {
  startTime: number;
  endTime?: number;
}
export type GuideDetails = GuideProfile & {
  profileImage?: string;
  welcomeMessage?: string;
  welcomeMessageDuration?: number;
  availableTimes?: IAvailabledDates[]
};

/**
 * @property {string} setting;
 * @property {string} headline;
 * @property {string} answer;
 */
export interface Highlight {
  setting: string;
  headline?: string;
  answer?: string;
}
export async function createGuideProfile(profile: GuideProfile, pid: string): Promise<GuideProfile> {
  profile.id = profile.id ?? createId();
  profile.createdBy = pid;
  profile.createdAt = currentAt();
  profile.createdOn = currentOn();
  profile.updatedBy = profile.createdBy;
  profile.updatedAt = profile.createdAt;
  profile.updatedOn = profile.createdOn;

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSGuideProfile.createGuideProfile(config.awsConfig!, profile);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return profile;
}
export async function getGuideProfileByPid(pid: string): Promise<Option<GuideProfile>> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSGuideProfile.findById(config.awsConfig!, pid);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function updateGuideProfile(profile: GuideProfile, pid: string, fieldsToUpdate: string[]): Promise<GuideProfile> {
  if (profile.id == null) throw Error('GuideProfile must have `id`.');

  profile.updatedBy = pid;
  profile.updatedOn = currentOn();
  profile.updatedAt = currentAt();

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSGuideProfile.updateGuideProfile(config.awsConfig!, profile, fieldsToUpdate);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return profile;
}
export async function removeGuideProfileFields(id: string, fieldsToRemove: string[]) {
  if (id == null) throw Error('GuideProfile must have `id`.');

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSGuideProfile.removeFields(config.awsConfig!, id, fieldsToRemove);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function loadAllGuides(): Promise<GuideProfile[]> {
  switch (config.deploymenEnv) {
    case 'aws': return AWSGuideProfile.loadAll(config.awsConfig!);
    case 'azure': throw Error('Not implemented yet.')
  }
}
export async function createDeletedGuide(data: GuideProfile): Promise<GuideProfile> {
  switch (config.deploymenEnv) {
    case 'aws':
      await AWSGuideProfile.createDeletedGuide(config.awsConfig!, data);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return data;
}
export async function deleteGuide(id: string): Promise<void> {
  switch (config.deploymenEnv) {
    case 'aws':
      await AWSGuideProfile.deleteGuide(config.awsConfig!, id);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
