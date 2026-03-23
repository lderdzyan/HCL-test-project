import { Effect, pipe } from 'effect';
import * as O from 'effect/Option';
import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { IConfig } from '../../config';
import { doCreateEffect, doGetEffect, doQueryEffect, doUpdateEffect, SortKey } from '..';
import { IndicatorAnswer } from '../../../entities/wlf-indicator/answer';
import { currentAt, currentOn } from '../../../entity';
import { SurveyAnswerProcessStatus } from '../../../constants';
import { AnswerItem } from '../../../entities/survey-answer';

/*
 * attr3 (string) - status
 * attr4 (number) - createdAt
 */

export const findById = (config: IConfig, id: string): Effect.Effect<O.Option<IndicatorAnswer>, Error, never> =>
  pipe(
    doGetEffect<IndicatorAnswer>(
      config,
      new GetCommand({
        TableName: config.ddbTable,
        Key: { _pk: id, _sk: SortKey.WlfIndicatorAnswer },
        ConsistentRead: true,
      }),
    ),
    Effect.map(O.fromNullable),
  );

export const createAnswers = (
  config: IConfig,
  data: AnswerItem,
  surveyId: string,
  pid: string,
): Effect.Effect<string, Error> => {
  const enrichedData = {
    id: pid,
    surveyId,
    status: SurveyAnswerProcessStatus.InProgress,
    createdBy: pid,
    createdAt: currentAt(),
    createdOn: currentOn(),
    answers: JSON.stringify(data),
    updatedBy: pid,
    updatedAt: currentAt(),
    updatedOn: currentOn(),
  };

  return doCreateEffect(config, {
    _pk: enrichedData.id,
    _sk: SortKey.WlfIndicatorAnswer,
    attr4: enrichedData.createdAt,
    ...enrichedData,
  });
};

export const updateAnswers = (
  config: IConfig,
  wlf: IndicatorAnswer,
  pid: string,
  fieldsToUpdate: string[],
): Effect.Effect<string, Error, never> => {
  return Effect.gen(function* (_) {
    if (fieldsToUpdate.includes('completedAt')) wlf.completedAt = currentAt();

    const result = yield* _(
      doUpdateEffect(
        config,
        pid,
        SortKey.WlfIndicatorAnswer,
        {
          ...wlf,
          attr3: wlf.status,
          updatedBy: wlf.createdBy!,
          updatedAt: currentAt(),
          updatedOn: currentOn(),
        },
        ['attr3', ...fieldsToUpdate],
      ),
    );

    return result;
  }).pipe(Effect.catchAll((err) => Effect.fail(new Error(`Error on update statements: ${err.message}`))));
};
export const findAllByDateRange = (
  config: IConfig,
  startOfDate: number,
  endOfDate: number,
): Effect.Effect<IndicatorAnswer[], Error, never> => {
  return Effect.gen(function* (_) {
    const result = yield* _(
      doQueryEffect<IndicatorAnswer>(
        config,
        new QueryCommand({
          TableName: config.ddbTables.main,
          IndexName: 'attr4-index',
          KeyConditionExpression: `#sk = :sortKey AND #attr BETWEEN :attrValue1 AND :attrValue2`,
          ExpressionAttributeNames: { '#sk': '_sk', '#attr': 'attr4' },
          ExpressionAttributeValues: {
            ':sortKey': SortKey.WlfIndicatorAnswer,
            ':attrValue1': startOfDate,
            ':attrValue2': endOfDate,
          },
        }),
      ),
    );

    return result;
  }).pipe(Effect.catchAll((err) => Effect.fail(new Error(`Error on update statements: ${err.message}`))));
};
