import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { SortKey, doCreate, doGet, doQuery, doTransactWrite } from '..';
import { PromoCodeUsage } from '../../../entities/promo-service/promo-code-usage';
import { IConfig } from '../../config';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/lib/function';
import { currentAt, currentOn } from '../../../entity';

/*
 * attr1 (string) - pid
 * attr2 (string) - promoCodeId
 * attr3 (string)
 * attr4 (number) - createdAt
 */
export const findPromoUsageByUser = (
  config: IConfig,
  pid: string,
  promoCodeId: string,
): TE.TaskEither<Error, PromoCodeUsage[]> =>
  doQuery<PromoCodeUsage>(
    config,
    new QueryCommand({
      TableName: config.ddbTables.promoService,
      IndexName: 'attr1-index',
      KeyConditionExpression: `#sk = :sortKey AND #attr1 = :attrValue`,
      FilterExpression: '#promoCodeId = :promoCodeIdValue',
      ExpressionAttributeNames: {
        '#sk': '_sk',
        '#attr': 'attr1',
        '#promoCodeId': 'attr2'
      },
      ExpressionAttributeValues: {
        ':sortKey': SortKey.PromoCodeUsage,
        ':attrValue': pid,
        ':promoCodeIdValue': promoCodeId,
      },
    }),
  );

export const addPromoCodeUsage = (
  config: IConfig,
  usage: PromoCodeUsage,
): TE.TaskEither<Error, string> =>
  pipe(
    TE.of<never, PromoCodeUsage>(
      (() => {
        usage.id = `${usage.pid}_${usage.promoCodeId}`;
        usage.createdBy = usage.pid;
        usage.createdAt = currentAt();
        usage.createdOn = currentOn();
        usage.updatedBy = usage.createdBy;
        usage.updatedAt = usage.createdAt;
        usage.updatedOn = usage.createdOn;

        return usage;
      })(),
    ),
    TE.chain((promoCodeUsage) =>
      doCreate(
        { ...config, ddbTable: config.ddbTables.promoService },
        {
          _pk: promoCodeUsage.id,
          _sk: SortKey.PromoCodeUsage,
          attr1: promoCodeUsage.pid,
          attr2: promoCodeUsage.promoCodeId,
          attr4: promoCodeUsage.createdAt,
          ...promoCodeUsage
        }
      )
    )
  )

export const updatePromoCodeUsage = (
  config: IConfig,
  promoCodeUsage: PromoCodeUsage,
): TE.TaskEither<Error, string> =>
  pipe(
    doTransactWrite(config, {
      TransactItems: [
        {
          Update: {
            TableName: config.ddbTables.promoService,
            Key: { _pk: promoCodeUsage.id!, _sk: SortKey.PromoCodeUsage },
            UpdateExpression: 'SET #usageCount = :usageCount, #lastUsedAt = :lastUsedAt',
            ExpressionAttributeNames: {
              '#lastUsedAt': 'lastUsedAt',
              '#usageCount': 'usageCount',
            },
            ExpressionAttributeValues: {
              ':lastUsedAt': Date.now(),
              ':usageCount': promoCodeUsage.usageCount + 1,
            },
          },
        },
      ],
    }),
    TE.map(() => promoCodeUsage.id!),
  );

export const findById = (config: IConfig, id: string): TE.TaskEither<Error, O.Option<PromoCodeUsage>> =>
  pipe(
    doGet<PromoCodeUsage>(
      config,
      new GetCommand({
        TableName: config.ddbTables.promoService,
        Key: { _pk: id, _sk: SortKey.PromoCodeUsage },
        ConsistentRead: true,
      }),
    ),
    TE.map((promoCodes) => {
      if (promoCodes == null)
        return O.none;

      return O.some(promoCodes);
    }),
  );
