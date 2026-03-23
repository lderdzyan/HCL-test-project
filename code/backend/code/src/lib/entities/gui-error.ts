import { createId } from '@paralleldrive/cuid2';
import { Entity, currentAt, currentOn } from '../entity';
import config from '../../config';
import * as AWSGuiError from '../aws/dynamodb/gui-error';

/**
 * {@link Entity}
 * @property {string} personId - person ID
 * @property {string} uri - page URI
 * @property {string} error - error message
 * @property {string} stacktrace - stacktrace of cought error
 */
export interface GuiError extends Entity {
  personId: string;
  uri: string;
  error: string;
  stacktrace: string;
}
export async function createGuiError(guiError: GuiError, pid: string): Promise<GuiError> {
  guiError.id = guiError.id ?? createId();
  guiError.createdBy = pid;
  guiError.createdAt = currentAt();
  guiError.createdOn = currentOn();
  guiError.updatedBy = guiError.createdBy;
  guiError.updatedAt = guiError.createdAt;
  guiError.updatedOn = guiError.createdOn;

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSGuiError.create(config.awsConfig!, guiError);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return guiError;
}
