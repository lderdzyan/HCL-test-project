import { createId } from '@paralleldrive/cuid2';
import { Entity, currentAt, currentOn } from '../entity';
import config from '../../config';
import { Option } from 'fp-ts/lib/Option';
import * as AWSCalendlyData from '../aws/dynamodb/calendly-data';
import { CalendlyEventType } from '../constants';

/**
 * {@link Entity}
 * @property {string} discussionId - surveyAnswerId
 * @property {string} guideId
 * @property {string} explorerId
 * @property {string} event
 * @property {string} payload - all data sent from calendly
 * @property {string} calendlyEventId
 */
export interface CalendlyData extends Entity {
  guideId?: string;
  explorerId?: string;
  event?: CalendlyEventType;
  payload?: string;
  calendlyEventId: string;
  discussionId?: string;
  [key: string]: any;
}
export async function createCalendlyData(calendlyData: CalendlyData, pid?: string): Promise<CalendlyData> {
  calendlyData.id = calendlyData.id ?? createId();
  calendlyData.createdBy = pid;
  calendlyData.createdAt = currentAt();
  calendlyData.createdOn = currentOn();
  calendlyData.updatedBy = calendlyData.createdBy;
  calendlyData.updatedAt = calendlyData.createdAt;
  calendlyData.updatedOn = calendlyData.createdOn;

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSCalendlyData.createCalendlyData(config.awsConfig!, calendlyData);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return calendlyData;
}
export async function getCalendlyDataByAnswerId(id: string): Promise<CalendlyData[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSCalendlyData.findAllByDiscussionId(config.awsConfig!, id);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function getCalendlyById(id: string): Promise<Option<CalendlyData>> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSCalendlyData.findById(config.awsConfig!, id);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function getCalendlyByEventId(eventId: string, type: CalendlyEventType): Promise<Option<CalendlyData>> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSCalendlyData.findByCalendlyEventId(config.awsConfig!, eventId, type);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function updateCalendlyData(calendlyData: CalendlyData, pid: string, fieldsToUpdate: string[]): Promise<CalendlyData> {
  if (calendlyData.id == null) throw Error('CalendlyData must have `id`.');

  calendlyData.updatedBy = pid;
  calendlyData.updatedOn = currentOn();
  calendlyData.updatedAt = currentAt();

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSCalendlyData.updateCalendlyData(config.awsConfig!, calendlyData, fieldsToUpdate);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return calendlyData;
}
