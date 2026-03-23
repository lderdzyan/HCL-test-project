import config from '../../config';
import { Entity, currentAt, currentOn } from '../entity';
import * as AWSSurveyAnswer from '../aws/dynamodb/survey-answer';
import { createId } from '@paralleldrive/cuid2';
import { SurveyAnswerProcessStatus } from '../constants';

/**
 * {@link Entity}
 * @property {string} surveyId - survey ID
 * @property {string} personId - PID of the person that pass survey
 * @property {number} purchaseDate - epoch of the survey's purchase date
 * @property {string} answers - survey answers in JSON string
 * @property {number} completedAt - epoch of the survey's answers complition date
 * @property {string} processResult - answers process result as JSON string
 * @property {string} name
 * @property {string} status
 */
export interface AnswerItem {
  [key: string]: number | string;
}
export interface SurveyAnswer extends Entity {
  surveyId?: string;
  personId?: string;
  purchaseDate?: number;
  completedAt?: number;
  answers?: string;
  processResult?: string;
  name?: string;
  status?: SurveyAnswerProcessStatus;
}
export async function findSurveyAnswerById(id: string): Promise<SurveyAnswer | undefined> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSSurveyAnswer.findById(config.awsConfig!, id);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function setSurveyAnswerResult(surveyAnswer: SurveyAnswer, pid: string): Promise<SurveyAnswer> {
  if (surveyAnswer.id == null) throw Error('SurveyAnswer must have `id`.');

  surveyAnswer.updatedBy = pid;
  surveyAnswer.updatedOn = currentOn();
  surveyAnswer.updatedAt = currentAt();

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSSurveyAnswer.updateResult(config.awsConfig!, surveyAnswer);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return surveyAnswer;
}
export async function updateSurveyAnswer(
  surveyAnswer: SurveyAnswer,
  pid: string,
  fieldsToUpdate: string[],
): Promise<SurveyAnswer> {
  if (surveyAnswer.id == null) throw Error('SurveyAnswer must have `id`.');

  surveyAnswer.updatedBy = pid;
  surveyAnswer.updatedOn = currentOn();
  surveyAnswer.updatedAt = currentAt();

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSSurveyAnswer.updateAnswer(config.awsConfig!, surveyAnswer, fieldsToUpdate);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return surveyAnswer;
}
export async function createSurveyAnswer(surveyAnswer: SurveyAnswer, pid: string): Promise<SurveyAnswer> {
  surveyAnswer.id = surveyAnswer.id ?? createId();
  surveyAnswer.createdBy = pid;
  surveyAnswer.createdAt = currentAt();
  surveyAnswer.createdOn = currentOn();
  surveyAnswer.updatedBy = surveyAnswer.createdBy;
  surveyAnswer.updatedAt = surveyAnswer.createdAt;
  surveyAnswer.updatedOn = surveyAnswer.createdOn;
  surveyAnswer.status = SurveyAnswerProcessStatus.New;

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSSurveyAnswer.createSurveyAnswer(config.awsConfig!, surveyAnswer);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return surveyAnswer;
}
export async function findAllAnswersByPersonId(pid: string): Promise<SurveyAnswer[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSSurveyAnswer.findAllByPersonId(config.awsConfig!, pid);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function findAllForResponsReport(startOfDate: number, endOfDate: number): Promise<SurveyAnswer[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSSurveyAnswer.findAllForResponsReport(config.awsConfig!, startOfDate, endOfDate);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function findAllForMOMResponsReport(startOfDate: number, endOfDate: number): Promise<SurveyAnswer[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSSurveyAnswer.findAllForMOMResponsReport(config.awsConfig!, startOfDate, endOfDate);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function findAll(startOfDate: number, endOfDate: number): Promise<SurveyAnswer[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSSurveyAnswer.findAll(config.awsConfig!, startOfDate, endOfDate);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function updateSurveyPurchaseDate(surveyAnswer: SurveyAnswer): Promise<SurveyAnswer> {
  if (surveyAnswer.id == null) throw Error('SurveyAnswer must have `id`.');

  surveyAnswer.purchaseDate = currentAt();
  surveyAnswer.updatedBy = surveyAnswer.createdBy;
  surveyAnswer.updatedOn = currentOn();
  surveyAnswer.updatedAt = currentAt();
  surveyAnswer.status = SurveyAnswerProcessStatus.Pending;

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSSurveyAnswer.updateSurveyPurchaseDate(config.awsConfig!, surveyAnswer);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return surveyAnswer;
}
