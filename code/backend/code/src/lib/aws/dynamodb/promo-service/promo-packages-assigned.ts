import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { createId } from '@paralleldrive/cuid2';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/lib/function';
import { SortKey, doCreate, doGet, doQuery } from '..';
import { PromoPackagesAssigned } from '../../../entities/promo-service/promo-packages-assigned';
import { currentAt, currentOn } from '../../../entity';
import { IConfig } from '../../config';

/*
 * attr1 (string) - mainPackageId
 * attr2 (string) - packageId
 */
export const findAssignedByPromoId = (
  config: IConfig,
  promoId: string,
): TE.TaskEither<Error, PromoPackagesAssigned[]> =>
  doQuery<PromoPackagesAssigned>(
    config,
    new QueryCommand({
      TableName: config.ddbTables.promoService,
      KeyConditionExpression: `#pk = :pKey AND begins_with(#sk, :skValue)`,
      ExpressionAttributeNames: { '#sk': '_sk', '#pk': '_pk' },
      ExpressionAttributeValues: {
        ':pKey': promoId,
        ':skValue': SortKey.PromoPackagesAssigned,
      },
      ConsistentRead: true
    }),
  );

export const findById = (config: IConfig, id: string, packageId: string): TE.TaskEither<Error, O.Option<PromoPackagesAssigned>> =>
  pipe(
    doGet<PromoPackagesAssigned>(
      config,
      new GetCommand({
        TableName: config.ddbTables.promoService,
        Key: { _pk: id, _sk: `${SortKey.PromoPackagesAssigned}_${packageId}` },
        ConsistentRead: true,
      }),
    ),
    TE.map((packageAssigned) => {
      if (packageAssigned == null) return O.none;

      return O.some(packageAssigned);
    }),
  );

export const findByPackageAndMainPackage = (
  config: IConfig,
  promoId: string,
  mainPromoId: string,
): TE.TaskEither<Error, PromoPackagesAssigned[]> =>
  doQuery<PromoPackagesAssigned>(
    config,
    new QueryCommand({
      TableName: config.ddbTables.promoService,
      IndexName: 'attr1-index',
      KeyConditionExpression: `#sk = :sortKey AND #attr = :attrValue`,
      ExpressionAttributeNames: { '#sk': '_sk', '#attr': 'attr1' },
      ExpressionAttributeValues: {
        ':sortKey': `${SortKey.PromoPackagesAssigned}_${promoId}`,
        ':attrValue': mainPromoId
      },
    }),
  );

export const createPromoPackagesAssigned = (
  config: IConfig,
  assign: PromoPackagesAssigned,
  pid: string,
): TE.TaskEither<Error, string> =>
  pipe(
    TE.of<never, PromoPackagesAssigned>(
      (() => {
        assign.id = assign.id ?? createId();
        assign.createdBy = pid;
        assign.createdAt = currentAt();
        assign.createdOn = currentOn();
        assign.updatedBy = assign.createdBy;
        assign.updatedAt = assign.createdAt;
        assign.updatedOn = assign.createdOn;

        return assign;
      })(),
    ),
    TE.chain((_assign) =>
      doCreate(
        { ...config, ddbTable: config.ddbTables.promoService },
        {
          _pk: _assign.id,
          _sk: `${SortKey.PromoPackagesAssigned}_${_assign.packageId}`,
          attr1: _assign.mainPackageId,
          attr2: _assign.packageId,
          ..._assign
        },
      ),
    ),
  );
