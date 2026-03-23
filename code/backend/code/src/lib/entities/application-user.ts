import config from '../../config';
import { currentAt, currentOn, Entity } from '../entity';
import * as AWSApplicationUser from '../aws/dynamodb/application-user';
import { AssignmentTargetType } from '../constants';

/**
 * {@link Entity}
 * @property {string} itemType - Discriminator used to identify the type of the item
 * @property {string} assignmentTargetId - CUID of the item being assigned (e.g., role, tag, label, permission)
 * @property {boolean} assignmentTargetType - Optional logical classification of the target (e.g., authz, team, label)
 * @property {boolean} subjectId - CUID of the entity receiving the item (identity or group)
 * @property {string} subjectType - Optional enum ("identity",  "group", etc) to distinguish subjects
 */
export interface ApplicationUser extends Entity {
  itemType: string;
  assignmentTargetId: string; //applicationId
  subjectId: string; //userCuid;
  subjectType: string;
  assignmentTargetType: string;
}

export const createApplicationUserObject = (overrides: Partial<ApplicationUser> = {}): ApplicationUser => ({
  id: '',
  itemType: 'assignment',
  assignmentTargetId: '',
  subjectId: '',
  subjectType: 'identity',
  assignmentTargetType: AssignmentTargetType.Application,
  ...overrides,
});

export async function createApplicationUser(data: ApplicationUser): Promise<ApplicationUser> {
  data.id = data.assignmentTargetId;
  data.createdBy = data.subjectId;
  data.createdAt = currentAt();
  data.createdOn = currentOn();
  data.updatedBy = data.createdBy;
  data.updatedAt = data.createdAt;
  data.updatedOn = data.createdOn;

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSApplicationUser.createApplicationUser(config.awsConfig!, data);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return data;
}

export async function findApplicationUserByUserId(uid: string): Promise<ApplicationUser[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSApplicationUser.loadAllByUserId(config.awsConfig!, uid);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
