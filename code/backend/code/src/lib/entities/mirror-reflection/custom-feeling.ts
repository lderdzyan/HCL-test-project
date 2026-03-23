import { callFunction } from '..';
import { Entity } from '../../entity';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import * as AWSCustomFeeling from '../../aws/dynamodb/mirror-reflection/custom-feeling';
import config from '../../../config';
import { CustomFeelingType } from './mirror-reflection';

/**
 * {@link Entity}
 * @property {string} pid
 * @property {CustomFeelingType} type
 * @property {Array<string>} text
 */

export interface CustomFeeling extends Entity {
  pid: string;
  type: CustomFeelingType;
  text: string[];
}

export type CustomFeelingDTO = Pick<CustomFeeling, 'id' | 'text' | 'type'>;

export const getCustomFeelingByUser = (pid: string): TE.TaskEither<Error, O.Option<CustomFeelingDTO[]>> =>
  callFunction(AWSCustomFeeling.findByUser)(config.awsConfig!, pid);

export const createCustomFeelingWords = (
  feelingWords: CustomFeeling,
  pid: string,
): TE.TaskEither<Error, string> =>
  callFunction(AWSCustomFeeling.createCustomFeelings)(config.awsConfig!, feelingWords, pid);
