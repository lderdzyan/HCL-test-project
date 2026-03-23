import { Effect, pipe } from 'effect';
import * as O from 'effect/Option';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { IConfig } from '../../config';
import { doCreateEffect, doGetEffect, doUpdateEffect, SortKey } from '..';
import { WlfBuilderAnswer, WlfBuilderInitialSteps } from '../../../entities/wlf-builder/answer';
import { SurveyAnswerProcessStatus } from '../../../constants';
import { currentAt, currentOn } from '../../../entity';

/*
 * attr3 (string) - status
 * attr4 (number) - createdAt
 */

export const findById = (config: IConfig, id: string): Effect.Effect<O.Option<WlfBuilderAnswer>, Error, never> =>
  pipe(
    doGetEffect<WlfBuilderAnswer>(
      config,
      new GetCommand({
        TableName: config.ddbTable,
        Key: { _pk: id, _sk: SortKey.WlfBuilderAnswer },
        ConsistentRead: true,
      }),
    ),
    Effect.map(O.fromNullable),
  );

export const createAnswers = (config: IConfig, surveyId: string, pid: string): Effect.Effect<string, Error> => {
  const enrichedData = {
    id: pid,
    surveyId,
    status: SurveyAnswerProcessStatus.New,
    step: WlfBuilderInitialSteps.GET_STARTED,
    createdBy: pid,
    createdAt: currentAt(),
    createdOn: currentOn(),
    updatedBy: pid,
    updatedAt: currentAt(),
    updatedOn: currentOn(),
  };

  return doCreateEffect(config, {
    _pk: enrichedData.id,
    _sk: SortKey.WlfBuilderAnswer,
    attr4: enrichedData.createdAt,
    ...enrichedData,
  });
};
export const updateAnswers = (
  config: IConfig,
  wlfBuilder: WlfBuilderAnswer,
  pid: string,
  fieldsToUpdate: string[],
): Effect.Effect<string, Error, never> => {
  return Effect.gen(function* (_) {
    if (fieldsToUpdate.includes('completedAt')) wlfBuilder.completedAt = currentAt();

    const result = yield* _(
      doUpdateEffect(
        config,
        pid,
        SortKey.WlfBuilderAnswer,
        {
          ...wlfBuilder,
          attr3: wlfBuilder.status,
          updatedBy: wlfBuilder.createdBy!,
          updatedAt: currentAt(),
          updatedOn: currentOn(),
        },
        ['attr3', ...fieldsToUpdate],
      ),
    );

    return result;
  }).pipe(Effect.catchAll((err) => Effect.fail(new Error(`Error on update statements: ${err.message}`))));
};
