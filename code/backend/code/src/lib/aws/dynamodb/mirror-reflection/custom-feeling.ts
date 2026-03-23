import { createId } from '@paralleldrive/cuid2';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { SortKey, doCreate, doQuery } from '..';
import { currentAt, currentOn } from '../../../entity';
import { IConfig } from '../../config';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/lib/function';
import { CustomFeeling, CustomFeelingDTO } from '../../../entities/mirror-reflection/custom-feeling';

/*
 * attr1 (string) - pid
 * attr2 (CustomFeelingType) - type
 * attr4 (number) - createdAt
 */

export const findByUser = (config: IConfig, pid: string): TE.TaskEither<Error, O.Option<CustomFeelingDTO[]>> =>
  pipe(
    doQuery<CustomFeeling>(
      config,
      new QueryCommand({
        TableName: config.ddbTables.mirrorReflectionService,
        IndexName: 'attr1-index',
        KeyConditionExpression: `#sk = :sortKey AND #attr = :attrValue`,
        ExpressionAttributeNames: { '#sk': '_sk', '#attr': 'attr1' },
        ExpressionAttributeValues: {
          ':sortKey': SortKey.CustomFeeling,
          ':attrValue': pid,
        },
      }),
    ),
    TE.map((customFeelings) =>
      customFeelings.length === 0 ? O.none : O.some(customFeelings.map(({ id, text, type }) => ({ id, text, type }))),
    ),
  );

export const createCustomFeelings = (
  config: IConfig,
  feelingWords: CustomFeeling,
  pid: string,
): TE.TaskEither<Error, string> =>
  pipe(
    TE.of<never, CustomFeeling>(
      (() => {
        feelingWords.id = feelingWords.id ?? createId();
        feelingWords.createdBy = pid;
        feelingWords.createdAt = currentAt();
        feelingWords.createdOn = currentOn();
        feelingWords.updatedBy = feelingWords.createdBy;
        feelingWords.updatedAt = feelingWords.createdAt;
        feelingWords.updatedOn = feelingWords.createdOn;

        return feelingWords;
      })(),
    ),
    TE.chain((_feelingWords) =>
      doCreate(
        { ...config, ddbTable: config.ddbTables.mirrorReflectionService },
        {
          _pk: _feelingWords.id,
          _sk: SortKey.CustomFeeling,
          attr1: _feelingWords.createdBy,
          attr2: _feelingWords.type,
          attr4: _feelingWords.createdAt,
          ..._feelingWords,
        },
      ),
    ),
  );
