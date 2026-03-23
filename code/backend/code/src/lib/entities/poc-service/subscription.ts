import { Entity } from '@/lib/entity';
import { Effect } from 'effect';
import * as AWSTaxSubscription from '../../aws/dynamodb/poc-service/subscription';
import config from '@/config';
import { callFunction } from '..';
import * as O from 'effect/Option';

/**
 * {@link Entity}
 * @property {string} subscriptionId
 * @property {string} pid
 * @property {string} email
 * @property {string} plan
 * @property {string} interval
 * @property {string} status
 * @property {string} stripeCustomerId
 * @property {string} stripeSubscriptionId
 * @property {string} stripeInvoiceId
 * @property {string} taxamoTransactionId
 * @property {string} billingCycle
 */
export enum PlanType {
  Monthly = 'monthly',
  Early = 'yearly',
}
export enum SubscriptionStatusType {
  Active = 'active',
  PastDue = 'past_due',
  Cancelled = 'cancelled',
}
export interface Subscription extends Entity {
  subscriptionId: string;
  pid: string;
  email: string;
  plan?: string;
  interval?: PlanType;
  status?: SubscriptionStatusType;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeInvoiceId?: string;
  taxamoTransactionId?: string;
  billingCycle?: string;
}

export const getTaxSubscriptionById = (pid: string): Effect.Effect<O.Option<Subscription>, Error, never> =>
  callFunction(AWSTaxSubscription.findById)(config.awsConfig!, pid);

export const createTaxamoSubscription = (data: Subscription): Effect.Effect<string, Error, never> =>
  callFunction(AWSTaxSubscription.createSubscription)(config.awsConfig!, data);

export const findSubscriptionByEmail = (email: string): Effect.Effect<Subscription[], Error, never> =>
  callFunction(AWSTaxSubscription.findByEmail)(config.awsConfig!, email);
