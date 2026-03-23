import config from '../../config';
import { currentAt, currentOn, Entity } from '../entity';
import * as AWSUserRole from '../aws/dynamodb/role-assigned-user';
import { AssignmentTargetType } from '../constants';

/**
 * {@link Entity}
 * @property {string} itemType - Discriminator used to identify the type of the item
 * @property {string} assignmentTargetId - CUID of the item being assigned (e.g., role, tag, label, permission)
 * @property {boolean} assignmentTargetType - Optional logical classification of the target (e.g., authz, team, label)
 * @property {boolean} subjectId - CUID of the entity receiving the item (identity or group)
 * @property {string} subjectType - Optional enum ("identity",  "group", etc) to distinguish subjects
 */
export interface RoleAssignedUser extends Entity {
  itemType: string;
  assignmentTargetId: string; //roleCuid
  subjectId: string; //userCuid;
  subjectType: string;
  assignmentTargetType: string;
}

export const createRoleAssignedUserObject = (overrides: Partial<RoleAssignedUser> = {}): RoleAssignedUser => ({
  id: '',
  itemType: 'assignment',
  assignmentTargetId: '',
  subjectId: '',
  subjectType: 'identity',
  assignmentTargetType: AssignmentTargetType.Role,
  ...overrides,
});

export async function createUserRole(data: RoleAssignedUser): Promise<RoleAssignedUser> {
  data.id = data.assignmentTargetId;
  data.createdBy = data.subjectId;
  data.createdAt = currentAt();
  data.createdOn = currentOn();
  data.updatedBy = data.createdBy;
  data.updatedAt = data.createdAt;
  data.updatedOn = data.createdOn;

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSUserRole.createUserRole(config.awsConfig!, data);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return data;
}

export async function findRolesByUserId(uid: string): Promise<RoleAssignedUser[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSUserRole.loadAllByUserId(config.awsConfig!, uid);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function deleteRoleAssigned(roleId: string, userId: string): Promise<void> {
  switch (config.deploymenEnv) {
    case 'aws':
      await AWSUserRole.deleteRoleAssigned(config.awsConfig!, roleId, userId);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
