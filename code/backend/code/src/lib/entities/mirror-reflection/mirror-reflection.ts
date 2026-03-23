import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import { callFunction } from '..';
import config from '../../../config';
import * as AWSMirrorReflection from '../../aws/dynamodb/mirror-reflection/mirror-reflection';
import { Entity } from '../../entity';

/**
 * {@link Entity}
 * @property {string} pid
 * @property {string} name
 * @property {string | string[] | Array<MirrorReflectionSubAnswer>} answers
 */
export interface MirrorReflection extends Entity {
  pid: string;
  name: string;
  answers: MirrorReflectionAnswer;
  startedAt?: number;
}

export interface MirrorReflectionAnswer {
  [key: string]: {
    name: string;
    type: string;
    answer: string | string[] | Array<MirrorReflectionSubAnswer>;
  };
}

export interface MirrorReflectionSubAnswer {
  title: string;
  answer: string;
}

export enum CustomFeelingType {
  upFeeling = 'UpFeeling',
  downFeeling = 'DownFeeling',
  topic = 'Topic',
}
export enum MirrorReflectionSummaryContentType {
  FeelingWord = 'FeelingWord',
  Topic = 'Topic',
  WorkLife = 'WorkLife',
}

export const getMirrorReflectionById = (id: string): TE.TaskEither<Error, O.Option<MirrorReflection>> =>
  callFunction(AWSMirrorReflection.findById)(config.awsConfig!, id);

export const doCreateMirrorReflection = (
  mirrorReflection: MirrorReflection,
  pid: string,
): TE.TaskEither<Error, string> =>
  callFunction(AWSMirrorReflection.createMirrorReflection)(config.awsConfig!, mirrorReflection, pid);

export const deleteMirrorReflection = (id: string): TE.TaskEither<Error, string> =>
  callFunction(AWSMirrorReflection.deleteById)(config.awsConfig!, id);

export const createDeletedMirrorReflection = (mirrorReflection: MirrorReflection): TE.TaskEither<Error, string> =>
  callFunction(AWSMirrorReflection.createDeletedMirrorReflection)(config.awsConfig!, mirrorReflection);

export const getMirrorReflectionsListByUser = (pid: string): TE.TaskEither<Error, MirrorReflection[]> =>
  callFunction(AWSMirrorReflection.listByUser)(config.awsConfig!, pid);
