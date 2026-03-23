import { createId } from "@paralleldrive/cuid2";
import { GuidedDiscussionActionsStatus } from "../constants";
import { Entity, currentAt, currentOn } from "../entity";
import config from "../../config";
import * as AWSDiscussionActions from '../aws/dynamodb/guided-discussion-actions';
import { Option } from "fp-ts/lib/Option";

/**
 * {@link Entity}
 * @property {string} id - guided discussion id is the same _pk as surveyAnswerId
 * @property {string} guideId
 * @property {string} explorerId
 * @property {string} status
 * @property {string} message
 * @property {string} actions
 */
export interface DiscussionAction {
  type: 'start' | 'stop' | 'continue';
  values: [{
    author: 'guide' | 'explorer';
    message: string;
  }];
}
export interface GuidedDiscussionActions extends Entity {
  guideId?: string;
  explorerId: string;
  actions?: DiscussionAction[];
  status: GuidedDiscussionActionsStatus;
  message?: string;
  actionsForExplorer?: DiscussionAction[];
  messageForExplorer?: string;
}
export async function createDiscussionAction(discussionAction: GuidedDiscussionActions, pid: string): Promise<GuidedDiscussionActions> {
  discussionAction.id = discussionAction.id ?? createId();
  discussionAction.status = GuidedDiscussionActionsStatus.CREATED;
  discussionAction.createdBy = pid;
  discussionAction.createdAt = currentAt();
  discussionAction.createdOn = currentOn();
  discussionAction.updatedBy = discussionAction.createdBy;
  discussionAction.updatedAt = discussionAction.createdAt;
  discussionAction.updatedOn = discussionAction.createdOn;

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSDiscussionActions.createDiscussionAction(config.awsConfig!, discussionAction);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return discussionAction;
}
export async function getDiscussionActionsById(id: string): Promise<Option<GuidedDiscussionActions>> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSDiscussionActions.findById(config.awsConfig!, id);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function updateDiscussionActions(discussionActions: GuidedDiscussionActions, pid: string, fieldsToUpdate: string[]): Promise<GuidedDiscussionActions> {
  if (discussionActions.id == null) throw Error('GuidedDiscussionActions must have `id`.');

  discussionActions.updatedBy = pid;
  discussionActions.updatedOn = currentOn();
  discussionActions.updatedAt = currentAt();

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSDiscussionActions.updateDiscussionActions(config.awsConfig!, discussionActions, fieldsToUpdate);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return discussionActions;
}
export async function removeDiscussionActionsFields(id: string, fieldsToRemove: string[]) {
  if (id == null) throw Error('GuidedDiscussionActions must have `id`.');

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSDiscussionActions.removeFields(config.awsConfig!, id, fieldsToRemove);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
