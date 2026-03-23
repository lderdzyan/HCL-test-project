import { createId } from '@paralleldrive/cuid2';
import { Entity, currentAt, currentOn } from '../entity';
import config from '../../config';
import * as AWSPageTracking from '../aws/dynamodb/page-tracking';

/**
 * {@link Entity}
 * @property {string} personId - person unique ID
 * @property {string} uri - page URI
 */
export interface PageTracking extends Entity {
  personId: string;
  uri: string;
}

export async function createPageTracking(pageTracking: PageTracking, pid: string): Promise<PageTracking> {
  pageTracking.id = pageTracking.id ?? createId();
  pageTracking.createdBy = pid;
  pageTracking.createdAt = currentAt();
  pageTracking.createdOn = currentOn();
  pageTracking.updatedBy = pageTracking.createdBy;
  pageTracking.updatedAt = pageTracking.createdAt;
  pageTracking.updatedOn = pageTracking.createdOn;

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSPageTracking.create(config.awsConfig!, pageTracking);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return pageTracking;
}
