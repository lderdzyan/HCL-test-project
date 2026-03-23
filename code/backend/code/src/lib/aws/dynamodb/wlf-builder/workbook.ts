import { Effect, pipe } from 'effect';
import * as O from 'effect/Option';
import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { IConfig } from '../../config';
import { doCreateEffect, doGetEffect, doQueryEffect, doUpdateEffect, SortKey } from '..';
import { WlfBuilderWorkbook as WlfBuilderWorkbook } from '../../../entities/wlf-builder/workbook';
import { currentAt, currentOn } from '../../../entity';
/*
 * attr4 (number) - createdAt
 */

export const findById = (config: IConfig, id: string): Effect.Effect<O.Option<WlfBuilderWorkbook>, Error, never> =>
  pipe(
    doGetEffect<WlfBuilderWorkbook>(
      config,
      new GetCommand({
        TableName: config.ddbTable,
        Key: { _pk: id, _sk: SortKey.WlfBuilderWorkbook },
        ConsistentRead: true,
      }),
    ),
    Effect.map(O.fromNullable),
  );

export const createWorkbook = (
  config: IConfig,
  data: WlfBuilderWorkbook,
  pid: string,
): Effect.Effect<string, Error> => {
  const enrichedData = {
    id: pid,
    createdBy: pid,
    createdAt: currentAt(),
    createdOn: currentOn(),
    updatedBy: pid,
    updatedAt: currentAt(),
    updatedOn: currentOn(),
    ...data,
  };

  return doCreateEffect(config, {
    _pk: enrichedData.id,
    _sk: SortKey.WlfBuilderWorkbook,
    attr4: enrichedData.createdAt,
    ...enrichedData,
  });
};

export const updateWorkbook = (
  config: IConfig,
  wlfBuilder: WlfBuilderWorkbook,
  pid: string,
  fieldsToUpdate: string[],
): Effect.Effect<string, Error, never> => {
  return Effect.gen(function* (_) {
    const result = yield* _(
      doUpdateEffect(
        config,
        pid,
        SortKey.WlfBuilderWorkbook,
        {
          ...wlfBuilder,
          updatedBy: wlfBuilder.createdBy!,
          updatedAt: currentAt(),
          updatedOn: currentOn(),
        },
        [...fieldsToUpdate],
      ),
    );

    return result;
  }).pipe(Effect.catchAll((err) => Effect.fail(new Error(`Error on update statements: ${err.message}`))));
};

export const findAllForReponseReport = (
  config: IConfig,
  startOfDate: number,
  endOfDate: number,
): Effect.Effect<WlfBuilderWorkbook[], Error, never> => {
  return Effect.gen(function* (_) {
    const result = yield* _(
      doQueryEffect<WlfBuilderWorkbook>(
        config,
        new QueryCommand({
          TableName: config.ddbTables.mirrorReflectionService,
          IndexName: 'attr4-index',
          KeyConditionExpression: `#sk = :sortKey AND #attr BETWEEN :attrValue1 AND :attrValue2`,
          ExpressionAttributeNames: { '#sk': '_sk', '#attr': 'attr4' },
          ExpressionAttributeValues: {
            ':sortKey': SortKey.WlfBuilderWorkbook,
            ':attrValue1': startOfDate,
            ':attrValue2': endOfDate,
          },
        }),
      ),
    );

    return result;
  }).pipe(Effect.catchAll((err) => Effect.fail(new Error(`Error on update statements: ${err.message}`))));
};
