import {
  createTaxamoSubscription,
  findSubscriptionByEmail,
  getTaxSubscriptionById,
} from '@/lib/entities/poc-service/subscription';
import { Effect, pipe } from 'effect/index';
import { Context } from 'hono';
import { createId } from '@paralleldrive/cuid2';
import * as O from 'effect/Option';

export const userSubscription = async (c: Context): Promise<Response> => {
  const requestData = await c.req.json();

  const { email, pid } = requestData;

  return Effect.runPromise(
    pipe(
      findSubscriptionByEmail(email),
      Effect.flatMap((subs) =>
        pipe(
          O.fromNullable(subs[0]),
          O.match({
            onSome: Effect.succeed,
            onNone: () =>
              pipe(
                createTaxamoSubscription({ email, pid, subscriptionId: createId() }),
                Effect.flatMap(getTaxSubscriptionById),
                Effect.flatMap(
                  O.match({
                    onNone: () => Effect.fail(new Error('Created subscription not found')),
                    onSome: Effect.succeed,
                  }),
                ),
              ),
          }),
        ),
      ),
      Effect.flatMap((subscription) => Effect.sync(() => c.json({ userInfo: subscription }, 200))),

      // 👇 Error handling
      Effect.catchAll((error) => Effect.sync(() => c.json({ error: error.message }, 500))),
    ),
  );
};
