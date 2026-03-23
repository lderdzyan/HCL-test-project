import { createId } from "@paralleldrive/cuid2";
import { currentAt, currentOn, Entity } from "../entity";
import config from '../../config';
import { Option } from "fp-ts/lib/Option";
import * as AWSAvailableDates from '../aws/dynamodb/available-dates';

/**
 * {@link Entity}
 * @property {number} startTime
 * @property {string} guideId
 * @property {string} startTimeStr
 * @property {string} scheduleUrl
 * @property {string} timezone
 */
export interface AvailableDates extends Entity {
  guideId: string;
  startTimeStr: string;
  startTime: number;
  scheduleUrl: string;
  timezone: string;
}

export async function createAvailableDates(availableDates: AvailableDates, pid?: string): Promise<AvailableDates> {
  availableDates.id = availableDates.id ?? createId();
  availableDates.createdBy = pid;
  availableDates.createdAt = currentAt();
  availableDates.createdOn = currentOn();
  availableDates.updatedBy = availableDates.createdBy;
  availableDates.updatedAt = availableDates.createdAt;
  availableDates.updatedOn = availableDates.createdOn;

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSAvailableDates.createAvailableDates(config.awsConfig!, availableDates);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return availableDates;
}
export async function getAvailableDatesById(id: string): Promise<Option<AvailableDates>> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSAvailableDates.findById(config.awsConfig!, id);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function findAvailableDatesByGuideId(guideId: string): Promise<AvailableDates[]> {
  switch (config.deploymenEnv) {
    case "aws":
      return AWSAvailableDates.findAllByGuideId(config.awsConfig!, guideId);
    case "azure":
      throw Error('Not implemented yet.');
  }
}
export async function batchWriteAvailableDates(params: Record<string, any>) {
  switch (config.deploymenEnv) {
    case "aws":
      return AWSAvailableDates.batchWrite(config.awsConfig!, params);
    case "azure":
      throw Error('Not implemented yet.');
  }
}
export async function findAllForGivenRange(startTime: number, endTime: number): Promise<AvailableDates[]> {
  switch (config.deploymenEnv) {
    case "aws":
      return AWSAvailableDates.findAllForGivenRange(config.awsConfig!, startTime, endTime);
    case "azure":
      throw Error('Not implemented yet.');
  }
}
