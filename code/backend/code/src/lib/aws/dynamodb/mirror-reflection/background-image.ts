import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { SortKey, doCreate, doGet, doUpdate } from '..';
import { IConfig } from '../../config';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/lib/function';
import { BackgroungImageDetails } from '../../../entities/mirror-reflection/background-image';
import { currentAt, currentOn } from '../../../entity';

/*
 * attr1 (string) - pid
 * attr4 (number) - createdAt
 */

export const findByUser = (config: IConfig, pid: string): TE.TaskEither<Error, O.Option<number>> =>
  pipe(
    doGet<BackgroungImageDetails>(
      config,
      new GetCommand({
        TableName: config.ddbTables.mirrorReflectionService,
        Key: { _pk: pid, _sk: SortKey.MirrorReflectionBackgroundImage },
        ConsistentRead: true,
      }),
    ),
    TE.map((backgroundImageDetails) => {
      if (backgroundImageDetails == null) return O.none;

      return O.some(backgroundImageDetails.currentImage);
    }),
  );

export const findByUserAllInfo = (
  config: IConfig,
  pid: string,
): TE.TaskEither<Error, O.Option<BackgroungImageDetails>> =>
  pipe(
    doGet<BackgroungImageDetails>(
      config,
      new GetCommand({
        TableName: config.ddbTables.mirrorReflectionService,
        Key: { _pk: pid, _sk: SortKey.MirrorReflectionBackgroundImage },
        ConsistentRead: true,
      }),
    ),
    TE.map((backgroundImageDetails) => {
      if (backgroundImageDetails == null) return O.none;

      return O.some(backgroundImageDetails);
    }),
  );

export const createBackgroundImage = (config: IConfig, pid: string): TE.TaskEither<Error, string> => {
  const _createdAt = currentAt();
  const _currentOn = currentOn();

  return pipe(
    doCreate(
      { ...config, ddbTable: config.ddbTables.mirrorReflectionService },
      {
        _pk: pid,
        _sk: SortKey.MirrorReflectionBackgroundImage,
        attr1: pid,
        attr4: _createdAt,
        id: pid,
        createdAt: _createdAt,
        createdOn: _currentOn,
        updatedBy: pid,
        updatedAt: _createdAt,
        updatedOn: _currentOn,
        currentImage: 1,
      },
    ),
    TE.mapLeft((err) => new Error(`Error on create background image: ${err.message}`)),
  );
};

export const updateBackgroundImage = (
  config: IConfig,
  bgImage: BackgroungImageDetails,
  pid: string,
): TE.TaskEither<Error, string> =>
  pipe(
    TE.of<never, BackgroungImageDetails>(
      (() => {
        bgImage.updatedBy = pid;
        bgImage.updatedAt = currentAt();
        bgImage.updatedOn = currentOn();

        return bgImage;
      })(),
    ),
    TE.chain((_bgImage) =>
      pipe(
        doUpdate(
          { ...config, ddbTable: config.ddbTables.mirrorReflectionService },
          _bgImage.id!,
          SortKey.MirrorReflectionBackgroundImage,
          {
            ..._bgImage,
            currentImage: _bgImage.currentImage >= 5 ? 1 : _bgImage.currentImage + 1,
          },
          ['currentImage'],
        ),
      ),
    ),
    TE.mapLeft((err) => new Error(`Error on update background image: ${err.message}`)),
  );

export const addBackgroundImageById = (config: IConfig, pid: string): TE.TaskEither<Error, string> =>
  pipe(
    findByUserAllInfo(config, pid),
    TE.chainW(
      O.fold(
        () => createBackgroundImage(config, pid),
        (backgroundImage) => updateBackgroundImage(config, backgroundImage, pid),
      ),
    ),
    TE.map(() => pid),
  );
