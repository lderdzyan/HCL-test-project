import config from '../../config';
import { Entity, currentAt, currentOn } from '../entity';
import * as AWSApplication from '../aws/dynamodb/application';
import { createId } from '@paralleldrive/cuid2';
import { createHash } from 'crypto';
import { Option } from 'fp-ts/lib/Option';

/**
 * {@link Entity}
 * @property {string} name - application name
 * @property {string} nameHash - application name hash
 * @property {boolean} active - represent is application active
 * @property {boolean} readyForDelete - can application be deleted
 * @property {string} path - application URL path
 */
export interface Application extends Entity {
  name?: string;
  nameHash?: string;
  active?: boolean;
  readyForDelete?: boolean;
  path?: string;
}

export async function loadApplicationByName(name: string): Promise<Application | undefined> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSApplication.loadApplicationByName(config.awsConfig!, name);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}

export async function findApplicationByPath(path: string): Promise<Option<Application>> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSApplication.loadApplicationByPath(config.awsConfig!, path);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}

export async function createApplication(application: Application, pid: string): Promise<Application> {
  application.id = application.id ?? createId();
  application.active = true;
  application.readyForDelete = false;
  application.nameHash = createHash('sha1').update(application.name!).digest('hex');
  application.createdBy = pid;
  application.createdAt = currentAt();
  application.createdOn = currentOn();
  application.updatedBy = application.createdBy;
  application.updatedAt = application.createdAt;
  application.updatedOn = application.createdOn;

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSApplication.createApplication(config.awsConfig!, application);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return application;
}

export async function findApplicationById(id: string): Promise<Option<Application>> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSApplication.loadApplicationById(config.awsConfig!, id);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}

export async function loadApplications(): Promise<Application[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSApplication.loadApplications(config.awsConfig!);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function updateApplication(
  application: Application,
  pid: string,
  fieldsToUpdate: string[],
): Promise<Application> {
  if (application.id == null) throw Error('Application must have `id`.');

  application.updatedBy = pid;
  application.updatedOn = currentOn();
  application.updatedAt = currentAt();

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSApplication.updateApplication(config.awsConfig!, application, fieldsToUpdate);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return application;
}
