import { GetCommand } from '@aws-sdk/lib-dynamodb';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { SortKey, doGet } from '..';
import { IConfig } from '../../config';
import { MirrorReflectionSummary } from '../../../entities/mirror-reflection/mirror-reflection-summary';

/*
 * attr1 (string) - pid
 * attr4 (number) - createdAt
 */

export const findById = (config: IConfig, id: string): TE.TaskEither<Error, O.Option<MirrorReflectionSummary>> =>
  pipe(
    doGet<MirrorReflectionSummary>(
      config,
      new GetCommand({
        TableName: config.ddbTables.mirrorReflectionService,
        Key: { _pk: id, _sk: SortKey.MirrorReflectionSummary },
        ConsistentRead: true,
      }),
    ),
    TE.map((summary) => {
      if (summary == null) return O.none;

      return O.some(summary);
    }),
  );

