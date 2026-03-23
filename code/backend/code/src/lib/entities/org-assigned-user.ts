import config from '../../config';
import { AssignmentTargetType } from '../constants';
import { currentAt, currentOn, Entity } from '../entity';
import * as AWSUserOrganization from '../aws/dynamodb/org-assigned-user';

/**
 * {@link Entity}
 * @property {string} itemType - Discriminator used to identify the type of the item
 * @property {string} assignmentTargetId - CUID of the item being assigned (e.g., role, tag, label, permission)
 * @property {boolean} assignmentTargetType - Optional logical classification of the target (e.g., authz, team, label)
 * @property {boolean} subjectId - CUID of the entity receiving the item (identity or group)
 * @property {string} subjectType - Optional enum ("identity",  "group", etc) to distinguish subjects
 */
export interface OrganizationAssignedUser extends Entity {
  itemType: string;
  assignmentTargetId: string; //orgCuid
  subjectId: string; //userCuid;
  subjectType: string;
  assignmentTargetType: string;
}

export const createOrgAssignedUserObject = (
  overrides: Partial<OrganizationAssignedUser> = {},
): OrganizationAssignedUser => ({
  id: '',
  itemType: 'organization',
  assignmentTargetId: '',
  subjectId: '',
  subjectType: 'identity',
  assignmentTargetType: AssignmentTargetType.Organization,
  ...overrides,
});

export async function createUserOrganization(data: OrganizationAssignedUser): Promise<OrganizationAssignedUser> {
  data.id = data.assignmentTargetId;
  data.createdBy = data.subjectId;
  data.createdAt = currentAt();
  data.createdOn = currentOn();
  data.updatedBy = data.createdBy;
  data.updatedAt = data.createdAt;
  data.updatedOn = data.createdOn;

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSUserOrganization.createUserOrganization(config.awsConfig!, data);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return data;
}
