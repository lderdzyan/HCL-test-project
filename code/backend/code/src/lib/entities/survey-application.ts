import config from '../../config';
import { Entity, currentAt, currentOn } from '../entity';
import * as AWSApplicationSurvey from '../aws/dynamodb/survey-application';
import { createId } from '@paralleldrive/cuid2';

/**
 * {@link Entity}
 * @property {string} surveyId
 * @property {string} applicationId
 */
export interface SurveyApplication extends Entity {
  surveyId: string;
  applicationId: string;
}

export async function findSurveysByApplicationId(applicationId: string): Promise<SurveyApplication[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSApplicationSurvey.findAllByApplicationId(config.awsConfig!, applicationId);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}

export async function createSurveyApplication(surveyApplication: SurveyApplication, pid: string): Promise<SurveyApplication> {
  surveyApplication.id = surveyApplication.id ?? createId();
  surveyApplication.createdBy = pid;
  surveyApplication.createdAt = currentAt();
  surveyApplication.createdOn = currentOn();
  surveyApplication.updatedBy = surveyApplication.createdBy;
  surveyApplication.updatedAt = surveyApplication.createdAt;
  surveyApplication.updatedOn = surveyApplication.createdOn;

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSApplicationSurvey.createSurveyApplication(config.awsConfig!, surveyApplication);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return surveyApplication;
}

export async function removeSurveyFromApplication(id: string) {
  switch (config.deploymenEnv) {
    case 'aws':
      await AWSApplicationSurvey.deleteSurveyApplication(config.awsConfig!, id);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
