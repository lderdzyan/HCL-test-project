import { Effect, pipe } from 'effect';
import * as O from 'effect/Option';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { IConfig } from '../../config';
import { IndicatorTrainingPlan } from '../../../entities/wlf-indicator/training-plan';
import { doCreateEffect, doGetEffect, doUpdateEffect, SortKey } from '..';
import { currentAt, currentOn } from '../../../entity';
/*
 * attr4 (number) - createdAt
 */

export const findById = (config: IConfig, id: string): Effect.Effect<O.Option<IndicatorTrainingPlan>, Error, never> =>
  pipe(
    doGetEffect<IndicatorTrainingPlan>(
      config,
      new GetCommand({
        TableName: config.ddbTable,
        Key: { _pk: id, _sk: SortKey.WlfIndicatorTrainingPlan },
        ConsistentRead: true,
      }),
    ),
    Effect.map(O.fromNullable),
  );

export const createTrainingPlan = (
  config: IConfig,
  data: IndicatorTrainingPlan,
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
    _sk: SortKey.WlfIndicatorTrainingPlan,
    attr4: enrichedData.createdAt,
    ...enrichedData,
  });
};

export const updateTrainingPlan = (
  config: IConfig,
  wlf: IndicatorTrainingPlan,
  pid: string,
  fieldsToUpdate: string[],
): Effect.Effect<string, Error, never> => {
  return Effect.gen(function* (_) {
    const result = yield* _(
      doUpdateEffect(
        config,
        pid,
        SortKey.WlfIndicatorTrainingPlan,
        {
          ...wlf,
          updatedBy: wlf.createdBy!,
          updatedAt: currentAt(),
          updatedOn: currentOn(),
        },
        [...fieldsToUpdate],
      ),
    );

    return result;
  }).pipe(Effect.catchAll((err) => Effect.fail(new Error(`Error on update statements: ${err.message}`))));
};
