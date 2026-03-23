import { createId } from '@paralleldrive/cuid2';
import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { SortKey, doGet, doCreate, doDelete, doQuery, DeletedSortKey } from '..';
import { IConfig } from '../../config';
import { MirrorReflection } from '../../../entities/mirror-reflection/mirror-reflection';
import { currentAt, currentOn, Entity } from '../../../entity';

/*
 * attr1 (string) - pid
 * attr4 (number) - createdAt
 */

export interface MirrorReflectionDTO extends Entity {
  id: string;
  pid: string;
  name: string;
  answers: string;
}

export const findById = (config: IConfig, id: string): TE.TaskEither<Error, O.Option<MirrorReflection>> =>
  pipe(
    doGet<MirrorReflection>(
      config,
      new GetCommand({
        TableName: config.ddbTables.mirrorReflectionService,
        Key: { _pk: id, _sk: SortKey.MirrorReflection },
        ConsistentRead: true,
      }),
    ),
    TE.map((reflection) => {
      if (reflection == null) {
        return O.none;
      }

      return O.some(reflection);
    }),
  );

export const createMirrorReflection = (
  config: IConfig,
  mirrorReflection: MirrorReflection,
  pid: string,
): TE.TaskEither<Error, string> =>
  pipe(
    TE.of<never, MirrorReflectionDTO>(
      (() => {
        const _currentAt = currentAt();
        const _currentOn = currentOn();

        return {
          ...mirrorReflection,
          id: mirrorReflection.id ?? createId(),
          pid: pid,
          createdBy: pid,
          createdAt: mirrorReflection.startedAt || _currentAt,
          createdOn: _currentOn,
          updatedBy: pid,
          updatedAt: _currentAt,
          updatedOn: _currentOn,
          answers: JSON.stringify(mirrorReflection.answers),
        };
      })(),
    ),
    TE.chain((_mirrorReflection) =>
      doCreate(
        { ...config, ddbTable: config.ddbTables.mirrorReflectionService },
        {
          _pk: _mirrorReflection.id,
          _sk: SortKey.MirrorReflection,
          attr1: pid,
          attr4: _mirrorReflection.createdAt,
          ..._mirrorReflection,
        },
      ),
    ),
  );

export const deleteById = (config: IConfig, id: string): TE.TaskEither<Error, string> =>
  doDelete({ ...config, ddbTable: config.ddbTables.mirrorReflectionService }, id, SortKey.MirrorReflection);

export const createDeletedMirrorReflection = (
  config: IConfig,
  mirrorReflection: MirrorReflection,
): TE.TaskEither<Error, string> =>
  pipe(
    TE.of<never, MirrorReflection>(
      (() => {
        return {
          ...mirrorReflection,
          _sk: DeletedSortKey.MirrorReflection,
          attr1: mirrorReflection.pid,
          attr4: mirrorReflection.createdAt,
        };
      })(),
    ),
    TE.chain((mirrorReflection) => {
      return doCreate(
        { ...config, ddbTable: config.ddbTables.mirrorReflectionService },
        {
          _sk: DeletedSortKey.MirrorReflection,
          attr1: mirrorReflection.pid,
          attr4: mirrorReflection.createdAt,
          ...mirrorReflection,
        },
      );
    }),
    TE.mapLeft((err) => new Error(`CreateDeletedMirrorReflection failed: ${err.message}`)),
  );

export const listByUser = (config: IConfig, pid: string): TE.TaskEither<Error, MirrorReflection[]> =>
  pipe(
    doQuery<MirrorReflection>(
      config,
      new QueryCommand({
        TableName: config.ddbTables.mirrorReflectionService,
        IndexName: 'attr1-index',
        KeyConditionExpression: `#sk = :sortKey AND #attr = :attrValue`,
        ExpressionAttributeNames: { '#sk': '_sk', '#attr': 'attr1' },
        ExpressionAttributeValues: {
          ':sortKey': SortKey.MirrorReflection,
          ':attrValue': pid,
        },
      }),
    ),
  );
