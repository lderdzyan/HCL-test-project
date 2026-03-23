import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import { callFunction } from '..';
import config from '../../../config';
import * as AWSPromoCode from '../../aws/dynamodb/promo-service/promo-code';
import { Entity } from '../../entity';
import { PackageAssignData } from './promo-packages-assigned';

export enum PromoType {
  Package = 'package',
  Invite = 'invite',
  Report = 'report',
}

export enum PromoStatus {
  Active = 'active',
  Inactive = 'inactive',
  Draft = 'draft',
  Archived = 'archived',
}

/**
 * {@link Entity}
 * @property {string} promoCode
 * @property {string} type
 * @property {string} status
 * @property {string} description
 * @property {number} usageCount
 * @property {number} usageCountPerUser
 * @property {number} revenueAmount
 * @property {number} discountPercent
 * @property {number} discountAmount
 * @property {number} startDate
 * @property {number} leftCount
 * @property {number} expiration
 */
export interface PromoCode extends Entity {
  promoCode: string;
  type: PromoType;
  status: PromoStatus;
  description?: string;
  usageCount?: number;
  usageCountPerUser?: number;
  revenueAmount?: number;
  discountPercent?: number;
  discountAmount?: number;
  startDate?: number;
  leftCount?: number;
  expiration?: number;
  activatedAt?: number;
  deactivatedAt?: number;
  usedRevenue?: number;
  currentUsageCount?: number;
}

export const loadAllPromoCodes = (startEpoch: number, endEpoch: number): TE.TaskEither<Error, PromoCode[]> =>
  callFunction(AWSPromoCode.findAll)(config.awsConfig!, startEpoch, endEpoch);

export const loadAllActivePromoCodes = (): TE.TaskEither<Error, PromoCode[]> =>
  callFunction(AWSPromoCode.findAllActive)(config.awsConfig!);

export const getPromoCodeByCode = (code: string): TE.TaskEither<Error, O.Option<PromoCode>> =>
  callFunction(AWSPromoCode.findByCode)(config.awsConfig!, code);

export const getPromoCodeById = (id: string): TE.TaskEither<Error, O.Option<PromoCode>> =>
  callFunction(AWSPromoCode.findById)(config.awsConfig!, id);

export const createPromoCodeAndAssign = (
  promoCode: PromoCode,
  packageIds: PackageAssignData[],
  pid: string,
): TE.TaskEither<Error, string> =>
  callFunction(AWSPromoCode.createPromoCode)(config.awsConfig!, promoCode, packageIds, pid);

export const deletePromoCode = (id: string): TE.TaskEither<Error, string> =>
  callFunction(AWSPromoCode.deletePromoCode)(config.awsConfig!, id);

export const updatePromoCode = (
  promoCode: PromoCode,
  pid: string,
  fieldsToUpdate: string[],
  fieldsToRemove: string[],
): TE.TaskEither<Error, string> =>
  callFunction(AWSPromoCode.updatePromoCode)(config.awsConfig!, promoCode, pid, fieldsToUpdate, fieldsToRemove);

export const assignPromoCode = (
  promoCodeId: string,
  packageIds: PackageAssignData[],
  pid: string,
): TE.TaskEither<Error, string> =>
  callFunction(AWSPromoCode.assignPromoCode)(config.awsConfig!, promoCodeId, packageIds, pid);

export const updateApplyOnlyUsage = (promoCode: PromoCode, revenueAmount: number): TE.TaskEither<Error, PromoCode> =>
  callFunction(AWSPromoCode.applyOnlyUsage)(config.awsConfig!, promoCode, revenueAmount);

export const updateApplyRevenueAndUsageCount = (promoCode: PromoCode, revenueAmount: number): TE.TaskEither<Error, PromoCode> =>
  callFunction(AWSPromoCode.applyRevenueAndUsageCount)(config.awsConfig!, promoCode, revenueAmount);

export const updateApplyPromoCode = (promoCode: PromoCode, revenueAmount: number): TE.TaskEither<Error, PromoCode> =>
  callFunction(AWSPromoCode.applyPromoCode)(config.awsConfig!, promoCode, revenueAmount);

export const updateApplyOnlyRevenueAmount = (promoCode: PromoCode, revenueAmount: number): TE.TaskEither<Error, PromoCode> =>
  callFunction(AWSPromoCode.applyOnlyRevenueAmount)(config.awsConfig!, promoCode, revenueAmount);
