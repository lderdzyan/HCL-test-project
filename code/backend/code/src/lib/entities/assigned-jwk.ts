import { createId } from '@paralleldrive/cuid2';
import { Entity, currentAt, currentOn } from '../entity';
import config from '../../config';
import * as AWSAssignedJWK from '../aws/dynamodb/assigned-jwk';

/**
 * {@link Entity}
 * @property {string} id - JWKDetails pk
 * @property {string} objectId - personId or applicationId
 */
export interface AssignedJWKDetails extends Entity {
  objectId: string;
}
export async function assignJWK(assignedJWK: AssignedJWKDetails, pid: string): Promise<AssignedJWKDetails> {
  assignedJWK.id = assignedJWK.id ?? createId();
  assignedJWK.createdBy = pid;
  assignedJWK.createdAt = currentAt();
  assignedJWK.createdOn = currentOn();
  assignedJWK.updatedBy = assignedJWK.createdBy;
  assignedJWK.updatedAt = assignedJWK.createdAt;
  assignedJWK.updatedOn = assignedJWK.createdOn;

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSAssignedJWK.assign(config.awsConfig!, assignedJWK);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return assignedJWK;
}
