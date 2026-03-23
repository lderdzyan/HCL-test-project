import { createId } from '@paralleldrive/cuid2';
import { Entity, currentAt, currentOn } from '../entity';
import * as AWSEventTracking from '../aws/dynamodb/event-tracking';
import config from '../../config';
import { callFunction } from '.';
import * as TE from 'fp-ts/TaskEither';

/**
 * {@link Entity}
 * @property {string} surveyId
 * @property {string} personId - person unique ID
 * @property {string} customKey
 * @property {string} type
 */
export enum EventType {
  MomitEvent = 'momitEventDetails',
  MomitMomEvent = 'momitMomEventDetails',
  SurveyReportViewEvent = 'surveyReportViewEventDetails',
  BrandAndCommsEvent = 'brandAndCommsEventDetails',
  GuidedDiscussionEvent = 'guidedDiscussionEventDetails',
  PromoCodeUsageEvent = 'promoCodeUsageEvent',
  MirrorReflectionEvent = 'mirrorReflectionEventDetails',
  MRAnalyticsEvent = 'mrAnalyticsEventDetails',
  WlfIndicatorEvent = 'wlfIndicatorEventDetails',
  WlfBuilderEvent = 'wlfBuilderEventDetails',
}
export enum GuidedDiscussionEvents {
  PackageInfo = 'packageInfo',
  Explorer = 'explorer',
  Guide = 'guide',
  CompletionStatus = 'completionStatus',
  Refunded = 'refunded',
  FocusAreasStarted = 'focusAreasStarted',
  RescheduleRequested = 'rescheduleRequested',
}
export interface EventTracking extends Entity {
  personId: string;
  surveyId?: string;
  customKey?: string;
  [key: string]: any;
  type: EventType;
}

export async function createEventTracking(eventTracking: EventTracking, pid: string): Promise<EventTracking> {
  eventTracking.id = eventTracking.id ?? createId();
  eventTracking.createdBy = pid;
  eventTracking.createdAt = eventTracking.createdAt ?? currentAt();
  eventTracking.createdOn = eventTracking.createdOn ?? currentOn();
  eventTracking.updatedBy = eventTracking.createdBy;
  eventTracking.updatedAt = eventTracking.createdAt;
  eventTracking.updatedOn = eventTracking.createdOn;

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSEventTracking.create(config.awsConfig!, eventTracking);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return eventTracking;
}
export async function findAllOfTypeByPersonIdWithoutName(
  personId: string,
  eventType: EventType,
): Promise<EventTracking[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSEventTracking.findAllOfTypeByPersonIdWithoutName(config.awsConfig!, personId, eventType);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function findAllByCustomKey(customKey: string, eventType: EventType): Promise<EventTracking[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSEventTracking.findAllByCustomKey(config.awsConfig!, customKey, eventType);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function findAllOfType(
  startOfDate: number,
  endOfDate: number,
  sortKey: EventType,
): Promise<EventTracking[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSEventTracking.findAllOfType(config.awsConfig!, startOfDate, endOfDate, sortKey);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function findAllByCustomKeyStartsWith(customKey: string, sortKey: EventType): Promise<EventTracking[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSEventTracking.findAllByCustomKeyStartsWith(config.awsConfig!, customKey, sortKey);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function updateEventTracking(
  eventTracking: EventTracking,
  pid: string,
  fields: string[],
): Promise<EventTracking> {
  if (eventTracking.id == null) throw Error('UserProfile must have `id`.');

  eventTracking.updatedBy = pid;
  eventTracking.updatedOn = currentOn();
  eventTracking.updatedAt = currentAt();

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSEventTracking.update(config.awsConfig!, eventTracking, fields);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return eventTracking;
}

export const getMRAnalyticsInfoFromEvents = (
  personId: string,
  startOfDate: number,
  endOfDate: number,
): TE.TaskEither<Error, EventTracking[]> =>
  callFunction(AWSEventTracking.findByPersonIdForMRAnalytics)(config.awsConfig!, personId, startOfDate, endOfDate);
