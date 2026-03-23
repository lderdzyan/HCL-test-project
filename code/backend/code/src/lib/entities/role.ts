import config from '../../config';
import { Entity, currentAt, currentOn } from '../entity';
import * as AWSRole from '../aws/dynamodb/role';
import { createId } from '@paralleldrive/cuid2';
import { Option } from 'fp-ts/lib/Option';
import { UserType } from '../constants';

/**
 * {@link Entity}
 * @property {string} name - application name
 * @property {boolean} active
 * @property {string} pid - cuid of the user who created the role
 */
export interface Role extends Entity {
  name?: UserType;
  active?: boolean;
  pid?: string;
}

export async function loadRoleByName(name: string): Promise<Role | undefined> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSRole.loadRoleByName(config.awsConfig!, name);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}

export async function createRole(role: Role, pid: string): Promise<Role> {
  role.id = role.id ?? createId();
  role.active = true;
  role.createdBy = pid;
  role.createdAt = currentAt();
  role.createdOn = currentOn();
  role.updatedBy = role.createdBy;
  role.updatedAt = role.createdAt;
  role.updatedOn = role.createdOn;

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSRole.createRole(config.awsConfig!, role);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return role;
}

export async function findRoleById(id: string): Promise<Option<Role>> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSRole.loadRoleById(config.awsConfig!, id);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}

export async function loadRoles(): Promise<Role[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSRole.loadRoles(config.awsConfig!);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
