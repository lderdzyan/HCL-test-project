import { Option } from 'fp-ts/lib/Option';
import config from '../../config';
import { Entity, currentAt, currentOn } from '../entity';
import { createId } from '@paralleldrive/cuid2';
import * as ASWPackage from '../aws/dynamodb/package';
import * as TE from 'fp-ts/TaskEither';
import { callFunction } from '.';

/**
 * {@link Entity}
 * @property {string} name
 * @property {string} description
 * @property {number} discount
 * @property {string} personId
 * @property {string[]} productId
 * @property {string} mainPackageId
 * @property {boolean} isUsed
 */

export interface Package extends Entity {
  name: string;
  description?: string;
  discount?: number;
  productId: string[];
  personId?: string;
  mainPackageId?: string;
  isUsed?: boolean;
}

export async function findPackageById(id: string): Promise<Option<Package>> {
  switch (config.deploymenEnv) {
    case 'aws':
      return ASWPackage.findById(config.awsConfig!, id);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}

export async function createPackage(data: Package, pid: string): Promise<Package> {
  data.id = data.id ?? createId();
  data.createdBy = pid;
  data.personId = pid;
  data.createdAt = currentAt();
  data.createdOn = currentOn();
  data.updatedBy = data.createdBy;
  data.updatedAt = data.createdAt;
  data.updatedOn = data.createdOn;

  switch (config.deploymenEnv) {
    case 'aws':
      await ASWPackage.createPackage(config.awsConfig!, data);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return data;
}
export async function loadAllPackages(): Promise<Package[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return ASWPackage.loadAll(config.awsConfig!);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function createDeletedPackage(data: Package): Promise<Package> {
  switch (config.deploymenEnv) {
    case 'aws':
      await ASWPackage.createDeletedPackage(config.awsConfig!, data);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return data;
}
export async function deletePackageInfo(id: string): Promise<void> {
  switch (config.deploymenEnv) {
    case 'aws':
      await ASWPackage.deletePackage(config.awsConfig!, id);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function updatePackage(data: Package, fieldsToUpdate: string[]): Promise<Package> {
  if (data.id == null) throw Error('Package must have `id`.');

  data.updatedBy = data.createdBy;
  data.updatedOn = currentOn();
  data.updatedAt = currentAt();

  switch (config.deploymenEnv) {
    case 'aws':
      await ASWPackage.updatePackage(config.awsConfig!, data, fieldsToUpdate);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return data;
}
export async function batchGetPackages(
  params: Record<string, any>,
  projections?: string[],
): Promise<Record<string, any>[]> {
  return await ASWPackage.batchGet(config.awsConfig!, params, projections);
}

export async function findAllRelatedByMainId(id: string): Promise<Package[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return ASWPackage.findAllRelatedByMainId(config.awsConfig!, id);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function loadAllDuplicatedPackages(): Promise<Package[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return ASWPackage.loadAllDuplicated(config.awsConfig!);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export const deletePackage = (id: string): TE.TaskEither<Error, string> =>
  callFunction(ASWPackage.deletePackageTask)(config.awsConfig!, id);
