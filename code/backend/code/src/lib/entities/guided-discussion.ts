import { createId } from "@paralleldrive/cuid2";
import { Entity, currentAt, currentOn } from "../entity";
import config from "../../config";
import * as AWSGuidedDiscussion from '../aws/dynamodb/guided-discussion';
import { Option } from "fp-ts/lib/Option";
import { GuidedDiscussionStatus } from "../constants";

/**
 * {@link Entity}
 * @property {string} id - guided discussion id is the same _pk as surveyAnswerId
 * @property {string} guideId
 * @property {string} explorerId
 * @property {string[]} inventoryItems - survey/inventory items ids
 * @property {string} explorerName
 * @property {string} status
 * @property {string} startTime
 * @property {string} endTime
 * @property {string} zoomUrl
 * @property {string} cancelUrl
 * @property {string} rescheduleUrl
 */
export interface GuidedDiscussion extends Entity {
  guideId?: string;
  explorerId: string;
  inventoryItems?: string[];
  explorerName?: string;
  status: GuidedDiscussionStatus;
  startTime?: number;
  endTime?: number;
  zoomUrl?: string;
  calendlyData?: string;
  cancelUrl?: string;
  rescheduleUrl?: string;
  rescheduleRequested?: boolean;
  autoCancel?: boolean;
}
export async function createGuidedDiscussion(guidedDiscussion: GuidedDiscussion, pid: string): Promise<GuidedDiscussion> {
  guidedDiscussion.id = guidedDiscussion.id ?? createId();
  guidedDiscussion.createdBy = pid;
  guidedDiscussion.createdAt = currentAt();
  guidedDiscussion.createdOn = currentOn();
  guidedDiscussion.updatedBy = guidedDiscussion.createdBy;
  guidedDiscussion.updatedAt = guidedDiscussion.createdAt;
  guidedDiscussion.updatedOn = guidedDiscussion.createdOn;

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSGuidedDiscussion.createGuidedDiscussion(config.awsConfig!, guidedDiscussion);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return guidedDiscussion;
}
export async function getGuidedDiscussionById(id: string): Promise<Option<GuidedDiscussion>> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSGuidedDiscussion.findById(config.awsConfig!, id);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function getGuidedDiscussionByGuideId(guideId: string): Promise<GuidedDiscussion[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSGuidedDiscussion.findByGuideId(config.awsConfig!, guideId);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function getGuidedDiscussionByStatusAndRange(status: string, startTime: number, endTime: number): Promise<GuidedDiscussion[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSGuidedDiscussion.findByStatusWithTimeRange(config.awsConfig!, status, startTime, endTime);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function getGuidedDiscussionByExplorerId(explorerId: string, status?: GuidedDiscussionStatus): Promise<GuidedDiscussion[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSGuidedDiscussion.findByExplorerId(config.awsConfig!, explorerId, status);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function findAllDiscussionsForResponseReport(startOfDate: number, endOfDate: number): Promise<GuidedDiscussion[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSGuidedDiscussion.findAllForResponsReport(config.awsConfig!, startOfDate, endOfDate);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function updateGuidedDiscussion(guidedDiscussion: GuidedDiscussion, pid: string, fieldsToUpdate: string[]): Promise<GuidedDiscussion> {
  if (guidedDiscussion.id == null) throw Error('GuideProfile must have `id`.');

  guidedDiscussion.updatedBy = pid;
  guidedDiscussion.updatedOn = currentOn();
  guidedDiscussion.updatedAt = currentAt();

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSGuidedDiscussion.updateGuidedDiscussion(config.awsConfig!, guidedDiscussion, fieldsToUpdate);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return guidedDiscussion;
}
export async function removeGuidedDiscussionFields(id: string, fieldsToRemove: string[]) {
  if (id == null) throw Error('Guided discussion must have `id`.');

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSGuidedDiscussion.removeFields(config.awsConfig!, id, fieldsToRemove);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
