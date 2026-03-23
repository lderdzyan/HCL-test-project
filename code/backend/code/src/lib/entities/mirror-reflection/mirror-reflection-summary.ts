import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import { callFunction } from '..';
import config from '../../../config';
import * as AWSMirrorReflectionSummary from '../../aws/dynamodb/mirror-reflection/mirror-reflection-summary';
import { Entity } from '../../entity';
import { MirrorReflectionSummaryContentType } from './mirror-reflection';

/**
 * {@link Entity}
 * @property {string} pid
 * @property {MirrorReflectionSummaryContentType} type
 * @property {Array<string>} text
 */

export interface MirrorReflectionSummary extends Entity {
  pid: string;
  type: MirrorReflectionSummaryContentType;
  text: string[];
}

export const getMirrorReflectionSummaryById = (id: string): TE.TaskEither<Error, O.Option<MirrorReflectionSummary>> =>
  callFunction(AWSMirrorReflectionSummary.findById)(config.awsConfig!, id);

