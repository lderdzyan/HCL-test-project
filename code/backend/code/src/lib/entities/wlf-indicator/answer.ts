import { callFunction } from '..';
import { Entity } from '../../entity';
import { Effect } from 'effect';
import * as O from 'effect/Option';
import * as AWSIndicator from '../../aws/dynamodb/wlf-indicator/answer';
import config from '../../../config';
import { SurveyAnswerProcessStatus } from '../../constants';
import { AnswerItem } from '../survey-answer';

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
 */

export interface IndicatorAnswer extends Entity {
  answers: string;
  surveyId: string;
  purchaseDate?: number;
  completedAt?: number;
  processResult?: string;
  name?: string;
  status?: SurveyAnswerProcessStatus;
  isEmailSent?: boolean;
}

export const getIndicatorByPid = (pid: string): Effect.Effect<O.Option<IndicatorAnswer>, Error, never> =>
  callFunction(AWSIndicator.findById)(config.awsConfig!, pid);

export const createIndicator = (
  answers: AnswerItem,
  surveyId: string,
  pid: string,
): Effect.Effect<string, Error, never> =>
  callFunction(AWSIndicator.createAnswers)(config.awsConfig!, answers, surveyId, pid);

export const updateIndicator = (
  data: IndicatorAnswer,
  pid: string,
  fieldsToUpdate: string[],
): Effect.Effect<string, Error, never> =>
  callFunction(AWSIndicator.updateAnswers)(config.awsConfig!, data, pid, fieldsToUpdate);
