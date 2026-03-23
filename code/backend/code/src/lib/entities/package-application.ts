import config from '../../config';
import { Entity, currentAt, currentOn } from '../entity';
import * as AWSApplicationPackage from '../aws/dynamodb/package-application';
import { createId } from '@paralleldrive/cuid2';
import { Option } from 'fp-ts/lib/Option';

/**
 * {@link Entity}
 * @property {string} packageId
 * @property {string[]} applicationsId
 */
export interface PackageApplication extends Entity {
  packageId: string;
  applicationsId: string[];
}
export async function findPackageAppllicationById(id: string): Promise<Option<PackageApplication>> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSApplicationPackage.findById(config.awsConfig!, id);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function findPackagesByApplicationId(applicationsId: string[]): Promise<PackageApplication[]> {
  const applicationsIdKey: string = applicationsId.sort().join('_');
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSApplicationPackage.findAllByApplicationsId(config.awsConfig!, applicationsIdKey);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function findAllApplicationsByPackageId(packageId: string): Promise<PackageApplication[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSApplicationPackage.findAllByPackageId(config.awsConfig!, packageId);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function findAllApplicationPackages(): Promise<PackageApplication[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSApplicationPackage.findAllApplicationPackages(config.awsConfig!);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}

export async function createPackageApplication(packageApplication: PackageApplication, pid: string): Promise<PackageApplication> {
  packageApplication.id = packageApplication.id ?? createId();
  packageApplication.createdBy = pid;
  packageApplication.createdAt = currentAt();
  packageApplication.createdOn = currentOn();
  packageApplication.updatedBy = packageApplication.createdBy;
  packageApplication.updatedAt = packageApplication.createdAt;
  packageApplication.updatedOn = packageApplication.createdOn;

  const applicationsIdKey: string = packageApplication.applicationsId.sort().join('_');

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSApplicationPackage.createPackageApplication(config.awsConfig!, packageApplication, applicationsIdKey);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return packageApplication;
}
export async function updatePackageApplication(data: PackageApplication, fieldsToUpdate: string[]): Promise<PackageApplication> {
  if (data.id == null) throw Error('PackageApplication must have `id`.');

  data.updatedBy = data.createdBy;
  data.updatedOn = currentOn();
  data.updatedAt = currentAt();

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSApplicationPackage.updatePackageApplication(config.awsConfig!, data, fieldsToUpdate);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return data;
}
