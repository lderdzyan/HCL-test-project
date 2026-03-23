import config from '../../config';
import { Entity, currentAt, currentOn } from '../entity';
import * as AWSSurvey from '../aws/dynamodb/survey';
import { createId } from '@paralleldrive/cuid2';

export enum SurveyType {
  MWI = 'mwi',
  WlfBuilder = 'builder',
  WLF = 'indicator',
}

/**
 * {@link Entity}
 * @property {string} path
 * @property {string} name
 */
export interface Survey extends Entity {
  path: string;
  name?: string;
}
export async function findSurveyById(id: string): Promise<Survey | undefined> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSSurvey.findById(config.awsConfig!, id);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}

export async function createSurvey(survey: Survey, pid: string): Promise<Survey> {
  survey.id = survey.id ?? createId();
  survey.createdBy = pid;
  survey.createdAt = currentAt();
  survey.createdOn = currentOn();
  survey.updatedBy = survey.createdBy;
  survey.updatedAt = survey.createdAt;
  survey.updatedOn = survey.createdOn;

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSSurvey.createSurvey(config.awsConfig!, survey);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return survey;
}
export async function updateSurvey(survey: Survey, pid: string, fieldsToUpdate: string[]): Promise<Survey> {
  if (survey.id == null) throw Error('Survey must have `id`.');

  survey.updatedBy = pid;
  survey.updatedOn = currentOn();
  survey.updatedAt = currentAt();

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSSurvey.updateSurvey(config.awsConfig!, survey, fieldsToUpdate);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return survey;
}
