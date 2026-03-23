import { callFunction } from '..';
import { Entity } from '../../entity';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import * as AWSBagroundImage from '../../aws/dynamodb/mirror-reflection/background-image';
import config from '../../../config';

/**
 * {@link Entity}
 * @property {string} pid
 * @property {number} currentImage
 */

export interface BackgroungImageDetails extends Entity {
  pid: string;
  currentImage: number;
}

export const getBgImageByPid = (pid: string): TE.TaskEither<Error, O.Option<number>> =>
  callFunction(AWSBagroundImage.findByUser)(config.awsConfig!, pid);

export const addBackgroundImageById = (pid: string): TE.TaskEither<Error, string> =>
  callFunction(AWSBagroundImage.addBackgroundImageById)(config.awsConfig!, pid);
