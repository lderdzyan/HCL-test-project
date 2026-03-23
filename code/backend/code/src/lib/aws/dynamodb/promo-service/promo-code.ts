import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { createId } from '@paralleldrive/cuid2';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { SortKey, doCreate, doDelete, doGet, doQuery, doRemove, doTransactWrite, doUpdate } from '..';
import { PromoCode, PromoStatus } from '../../../entities/promo-service/promo-code';
import { PackageAssignData, PromoPackagesAssigned } from '../../../entities/promo-service/promo-packages-assigned';
import { currentAt, currentOn } from '../../../entity';
import { IConfig } from '../../config';
import { createPromoPackagesAssigned, findAssignedByPromoId } from './promo-packages-assigned';

/*
 * attr1 (string) - promoCode
 * attr2 (string) - status
 * attr3 (string)
 * attr4 (number) - expiration
 */

export const findAllByStatus = (config: IConfig, status: PromoStatus): TE.TaskEither<Error, PromoCode[]> =>
  doQuery<PromoCode>(
    config,
    new QueryCommand({
      TableName: config.ddbTables.promoService,
      IndexName: 'attr2-index',
      KeyConditionExpression: `#sk = :sortKey AND #attr = :attrValue`,
      ExpressionAttributeNames: { '#sk': '_sk', '#attr': 'attr2' },
      ExpressionAttributeValues: {
        ':sortKey': SortKey.PromoCode,
        ':attrValue': status,
      },
    }),
  );

export const findAll = (config: IConfig, startDate: number, endDate: number): TE.TaskEither<Error, PromoCode[]> =>
  doQuery<PromoCode>(
    config,
    new QueryCommand({
      TableName: config.ddbTables.promoService,
      IndexName: 'attr4-index',
      KeyConditionExpression: `#sk = :sortKey AND #attr BETWEEN :attrValue1 AND :attrValue2`,
      ExpressionAttributeNames: { '#sk': '_sk', '#attr': 'attr4' },
      ExpressionAttributeValues: {
        ':sortKey': SortKey.PromoCode,
        ':attrValue1': startDate,
        ':attrValue2': endDate,
      },
    }),
  );
export const findAllActive = (config: IConfig): TE.TaskEither<Error, PromoCode[]> =>
  doQuery<PromoCode>(
    config,
    new QueryCommand({
      TableName: config.ddbTables.promoService,
      IndexName: 'attr2-index',
      KeyConditionExpression: `#sk = :sortKey AND #attr = :attrValue`,
      ExpressionAttributeNames: { '#sk': '_sk', '#attr': 'attr2' },
      ExpressionAttributeValues: {
        ':sortKey': SortKey.PromoCode,
        ':attrValue': PromoStatus.Active,
      },
    }),
  );
export const findById = (config: IConfig, id: string): TE.TaskEither<Error, O.Option<PromoCode>> =>
  pipe(
    doGet<PromoCode>(
      config,
      new GetCommand({
        TableName: config.ddbTables.promoService,
        Key: { _pk: id, _sk: SortKey.PromoCode },
        ConsistentRead: true,
      }),
    ),
    TE.map((promoCodes) => {
      if (promoCodes == null) return O.none;

      return O.some(promoCodes);
    }),
  );
export const findByCode = (config: IConfig, code: string): TE.TaskEither<Error, O.Option<PromoCode>> =>
  pipe(
    doQuery<PromoCode>(
      config,
      new QueryCommand({
        TableName: config.ddbTables.promoService,
        IndexName: 'attr1-index',
        KeyConditionExpression: `#sk = :sortKey AND #attr = :attrValue`,
        FilterExpression: `#attr2 = :attrValue2`,
        ExpressionAttributeNames: { '#sk': '_sk', '#attr': 'attr1', '#attr2': 'attr2' },
        ExpressionAttributeValues: {
          ':sortKey': SortKey.PromoCode,
          ':attrValue': code.toLowerCase(),
          ':attrValue2': PromoStatus.Active
        },
      }),
    ),
    TE.map((promoCodes) => {
      if (promoCodes.length === 0) {
        return O.none;
      }

      return O.some(promoCodes[0]);
    }),
  );

export const deletePromoCode = (config: IConfig, id: string): TE.TaskEither<Error, string> =>
  doDelete({ ...config, ddbTable: config.ddbTables.promoService }, id, SortKey.PromoCode);

export const createPromoCode = (
  config: IConfig,
  promoCode: PromoCode,
  packageIds: PackageAssignData[],
  pid: string,
): TE.TaskEither<Error, string> =>
  pipe(
    TE.of<never, PromoCode>(
      (() => {
        promoCode.id = promoCode.id ?? createId();
        promoCode.createdBy = pid;
        promoCode.createdAt = currentAt();
        promoCode.createdOn = currentOn();
        promoCode.updatedBy = promoCode.createdBy;
        promoCode.updatedAt = promoCode.createdAt;
        promoCode.updatedOn = promoCode.createdOn;

        return promoCode;
      })(),
    ),
    TE.chain((_promoCode) =>
      doCreate(
        { ...config, ddbTable: config.ddbTables.promoService },
        {
          _pk: _promoCode.id,
          _sk: SortKey.PromoCode,
          attr1: promoCode.promoCode.toLowerCase(),
          attr2: promoCode.status,
          attr4: promoCode.createdAt,
          ..._promoCode,
        },
      ),
    ),
    TE.chain((promoCodeId: string) =>
      pipe(
        A.traverse(TE.ApplicativePar)((packageData: PackageAssignData) =>
          createPromoPackagesAssigned(
            config,
            {
              id: promoCodeId,
              packageId: packageData.packageId!,
              mainPackageId: packageData.mainPackageId,
            },
            pid,
          ),
        )(packageIds),
        TE.map(() => promoCodeId),
      ),
    ),
  );

export const assignPromoCode = (
  config: IConfig,
  promoCodeId: string,
  packageIds: PackageAssignData[],
  pid: string,
): TE.TaskEither<Error, string> =>
  pipe(
    findAssignedByPromoId(config, promoCodeId),
    TE.chain(existingAssigned =>
      pipe(
        existingAssigned,
        A.traverse(TE.ApplicativePar)((assigned: PromoPackagesAssigned) =>
          doDelete(
            { ...config, ddbTable: config.ddbTables.promoService },
            promoCodeId,
            `${SortKey.PromoPackagesAssigned}_${assigned.packageId}`,
          ),
        ),
      ),
    ),
    TE.chain(() =>
      pipe(
        packageIds,
        A.traverse(TE.ApplicativePar)((packageData: PackageAssignData) =>
          createPromoPackagesAssigned(
            config,
            {
              id: promoCodeId,
              packageId: packageData.packageId!,
              mainPackageId: packageData.mainPackageId,
            },
            pid,
          ),
        ),
      ),
    ),
    TE.map(() => promoCodeId),
  );

export const updatePromoCode = (
  config: IConfig,
  promoCode: PromoCode,
  pid: string,
  fieldsToUpdate: string[],
  fieldsToRemove: string[],
): TE.TaskEither<Error, string> =>
  pipe(
    TE.of<never, PromoCode>(
      (() => {
        promoCode.updatedBy = pid;
        promoCode.updatedAt = currentAt();
        promoCode.updatedOn = currentOn();

        return promoCode;
      })(),
    ),
    TE.chain((_promoCode) =>
      pipe(
        doUpdate(
          { ...config, ddbTable: config.ddbTables.promoService },
          _promoCode.id!,
          SortKey.PromoCode,
          {
            ..._promoCode,
            attr1: promoCode.promoCode.toLowerCase(),
            attr2: promoCode.status,
            attr4: promoCode.createdAt,
          },
          ['attr1', 'attr2', 'attr4', ...fieldsToUpdate]
        ),
        TE.chain(() => {
          if (fieldsToRemove.length > 0) {
            return doRemove({ ...config, ddbTable: config.ddbTables.promoService },
              _promoCode.id!,
              SortKey.PromoCode,
              fieldsToRemove);
          }
          return TE.right(_promoCode.id!);
        }),
      )
    ),
  );

export const applyOnlyUsage = (config: IConfig, promoCode: PromoCode, revenueAmount: number): TE.TaskEither<Error, PromoCode> =>
  pipe(
    doTransactWrite(config, {
      TransactItems: [
        {
          Update: {
            TableName: config.ddbTables.promoService,
            Key: { _pk: promoCode.id, _sk: SortKey.PromoCode },
            UpdateExpression: 'SET #leftCount = :leftCount, #usageCount = :usageCount, #usedRevenue = :revenueAmount',
            ConditionExpression: 'attribute_not_exists(#maxRevenue) AND #leftCount > :zeroCount',
            ExpressionAttributeNames: {
              '#leftCount': 'leftCount',
              '#usageCount': 'currentUsageCount',
              '#usedRevenue': 'usedRevenue',
              '#maxRevenue': 'revenueAmount'
            },
            ExpressionAttributeValues: {
              ':leftCount': promoCode.leftCount == null ? 0 : promoCode.leftCount - 1,
              ':usageCount': promoCode.currentUsageCount == null ? 1 : promoCode.currentUsageCount + 1,
              ':zeroCount': 0,
              ':revenueAmount': (promoCode.usedRevenue ?? 0) + revenueAmount
            },
          },
        },
      ],
    }),
    TE.map(() => promoCode!),
  );

export const applyRevenueAndUsageCount = (config: IConfig, promoCode: PromoCode, revenueAmount: number): TE.TaskEither<Error, PromoCode> =>
  pipe(
    doTransactWrite(config, {
      TransactItems: [
        {
          Update: {
            TableName: config.ddbTables.promoService,
            Key: { _pk: promoCode.id, _sk: SortKey.PromoCode },
            UpdateExpression: 'SET #leftCount = :leftCount, #usageCount = :usageCount, #usedRevenue = :revenueAmount',
            ConditionExpression: '#leftCount > :zeroCount AND (attribute_not_exists(#usedRevenue) OR #usedRevenue < :maxRevenue)',
            ExpressionAttributeNames: {
              '#leftCount': 'leftCount',
              '#usageCount': 'currentUsageCount',
              '#usedRevenue': 'usedRevenue',
            },
            ExpressionAttributeValues: {
              ':leftCount': promoCode.leftCount == null ? 0 : promoCode.leftCount - 1,
              ':usageCount': promoCode.currentUsageCount == null ? 1 : promoCode.currentUsageCount + 1,
              ':zeroCount': 0,
              ':revenueAmount': (promoCode.usedRevenue ?? 0) + revenueAmount,
              ':maxRevenue': promoCode.revenueAmount
            },
          },
        },
      ],
    }),
    TE.map(() => promoCode!),
  );

export const applyPromoCode = (config: IConfig, promoCode: PromoCode, revenueAmount: number): TE.TaskEither<Error, PromoCode> =>
  pipe(
    doTransactWrite(config, {
      TransactItems: [
        {
          Update: {
            TableName: config.ddbTables.promoService,
            Key: { _pk: promoCode.id, _sk: SortKey.PromoCode },
            UpdateExpression: 'SET #usageCount = :usageCount, #usedRevenue = :revenueAmount',
            ConditionExpression: 'attribute_not_exists(#leftCount) AND attribute_not_exists(#maxRevenue)',
            ExpressionAttributeNames: {
              '#leftCount': 'leftCount',
              '#usageCount': 'currentUsageCount',
              '#usedRevenue': 'usedRevenue',
              '#maxRevenue': 'revenueAmount'
            },
            ExpressionAttributeValues: {
              ':usageCount': promoCode.currentUsageCount == null ? 1 : promoCode.currentUsageCount + 1,
              ':revenueAmount': (promoCode.usedRevenue ?? 0) + revenueAmount,
            },
          },
        },
      ],
    }),
    TE.map(() => promoCode!),
  );

export const applyOnlyRevenueAmount = (config: IConfig, promoCode: PromoCode, revenueAmount: number): TE.TaskEither<Error, PromoCode> =>
  pipe(
    doTransactWrite(config, {
      TransactItems: [
        {
          Update: {
            TableName: config.ddbTables.promoService,
            Key: { _pk: promoCode.id, _sk: SortKey.PromoCode },
            UpdateExpression: 'SET #usageCount = :usageCount, #usedRevenue = :revenueAmount',
            ConditionExpression: 'attribute_not_exists(#leftCount) AND (attribute_not_exists(#usedRevenue) OR #usedRevenue < :maxRevenue)',
            ExpressionAttributeNames: {
              '#leftCount': 'leftCount',
              '#usageCount': 'currentUsageCount',
              '#usedRevenue': 'usedRevenue',
            },
            ExpressionAttributeValues: {
              ':usageCount': promoCode.currentUsageCount == null ? 1 : promoCode.currentUsageCount + 1,
              ':revenueAmount': (promoCode.usedRevenue ?? 0) + revenueAmount,
              ':maxRevenue': promoCode.revenueAmount
            },
          },
        },
      ],
    }),
    TE.map(() => promoCode!),
  );
