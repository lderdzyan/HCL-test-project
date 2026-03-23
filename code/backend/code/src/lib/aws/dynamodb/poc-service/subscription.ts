import { Subscription } from '@/lib/entities/poc-service/subscription';
import { currentAt, currentOn } from '@/lib/entity';
import { Effect, pipe } from 'effect';
import { doCreateEffect, doGetEffect, doQueryEffect, PoCSortKey } from '..';
import { IConfig } from '../../config';
import * as O from 'effect/Option';
import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { createId } from '@paralleldrive/cuid2';

/*
 * attr1 (string) - email
 * attr2 (string) - stripeSubscriptionId
 * attr3 (string) - stripeCustomerId
 * attr4 (number) - createdAt
 */
export const createSubscription = (config: IConfig, data: Subscription): Effect.Effect<string, Error> => {
  const enrichedData = {
    attr3: data.stripeCustomerId,
    attr2: data.stripeSubscriptionId,
    attr1: data.email,
    createdBy: data.pid,
    createdAt: currentAt(),
    createdOn: currentOn(),
    response: JSON.stringify(data),
    updatedBy: data.pid,
    updatedAt: currentAt(),
    updatedOn: currentOn(),
    id: createId(),
    ...data,
  };

  return doCreateEffect(
    { ...config, ddbTable: config.ddbTables.pocService },
    {
      _pk: enrichedData.id,
      _sk: PoCSortKey.TaxamoSubscription,
      attr4: enrichedData.createdAt,
      ...enrichedData,
    },
  );
};
export const findById = (config: IConfig, id: string): Effect.Effect<O.Option<Subscription>, Error, never> =>
  pipe(
    doGetEffect<Subscription>(
      config,
      new GetCommand({
        TableName: config.ddbTables.pocService,
        Key: { _pk: id, _sk: PoCSortKey.TaxamoSubscription },
        ConsistentRead: true,
      }),
    ),
    Effect.map(O.fromNullable),
  );

export const findByEmail = (config: IConfig, email: string): Effect.Effect<Subscription[], Error, never> => {
  return Effect.gen(function* (_) {
    const result = yield* _(
      doQueryEffect<Subscription>(
        config,
        new QueryCommand({
          TableName: config.ddbTables.pocService,
          IndexName: 'attr1-index',
          KeyConditionExpression: `#sk = :sortKey AND #attr = :attrValue1`,
          ExpressionAttributeNames: { '#sk': '_sk', '#attr': 'attr1' },
          ExpressionAttributeValues: {
            ':sortKey': PoCSortKey.TaxamoSubscription,
            ':attrValue1': email,
          },
        }),
      ),
    );

    return result;
  }).pipe(Effect.catchAll((err) => Effect.fail(new Error(`Error on update statements: ${err.message}`))));
};
