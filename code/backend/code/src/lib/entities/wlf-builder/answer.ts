import { callFunction } from '..';
import { Entity } from '../../entity';
import { Effect } from 'effect';
import * as O from 'effect/Option';
import config from '../../../config';
import { SurveyAnswerProcessStatus } from '../../constants';
import * as AWSWlfBuilder from '../../aws/dynamodb/wlf-builder/answer';

/**
 * {@link Entity}
 * @property {string} surveyId
 * @property {string} answers
 * @property {number} completedAt
 * @property {number} purchaseDate
 * @property {string} name
 * @property {string} processResult
 * @property {string} status
 * @property {boolean} isEmailSent
 * @property {string} step
 */

export enum WlfBuilderInitialSteps {
  GET_STARTED = 'get_started',
  INTRODUCTION = 'introduction',
  SURVEY_PROGRESS = 'survey_progress',
}

export interface WlfBuilderAnswer extends Entity {
  answers: string;
  surveyId: string;
  purchaseDate?: number;
  completedAt?: number;
  processResult?: string;
  name?: string;
  status?: SurveyAnswerProcessStatus;
  isEmailSent?: boolean;
  step: WlfBuilderInitialSteps;
}
export const getWlfBuilderByPid = (pid: string): Effect.Effect<O.Option<WlfBuilderAnswer>, Error, never> =>
  callFunction(AWSWlfBuilder.findById)(config.awsConfig!, pid);

export const createWlfBuilder = (surveyId: string, pid: string): Effect.Effect<string, Error, never> =>
  callFunction(AWSWlfBuilder.createAnswers)(config.awsConfig!, surveyId, pid);

export const updateWlfBuilder = (
  data: WlfBuilderAnswer,
  pid: string,
  fieldsToUpdate: string[],
): Effect.Effect<string, Error, never> =>
  callFunction(AWSWlfBuilder.updateAnswers)(config.awsConfig!, data, pid, fieldsToUpdate);
