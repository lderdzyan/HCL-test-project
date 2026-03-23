import { createId } from '@paralleldrive/cuid2';
import config from '../../config';
import * as AWSSubscription from '../aws/dynamodb/subscription';
import { Entity, currentAt, currentOn } from '../entity';

/**
 * {@link Entity}
 * @property {string} firstName - user firstName
 * @property {string} lastName - user lastName
 * @property {string} email - user email
 * @property {string} country - user's country code
 * @property {boolean} notify - need to be notified or not
 */
export interface Subscription extends Entity {
  firstName: string;
  email: string;
  lastName: string;
  country: string;
  notify: boolean;
}

export async function createSubscription(subscription: Subscription, pid: string): Promise<Subscription> {
  subscription.id = subscription.id ?? createId();
  subscription.createdBy = pid;
  subscription.createdAt = currentAt();
  subscription.createdOn = currentOn();
  subscription.updatedBy = subscription.createdBy;
  subscription.updatedAt = subscription.createdAt;
  subscription.updatedOn = subscription.createdOn;

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSSubscription.createdSubscription(config.awsConfig!, subscription);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return subscription;
}
