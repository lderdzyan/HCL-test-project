import { callFunction } from '..';
import { Entity } from '../../entity';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import * as AWSPromoCodeUsage from '../../aws/dynamodb/promo-service/promo-code-usage';
import config from '../../../config';

/**
 * {@link Entity}
 * @property {string} promoCodeId
 * @property {string} pid
 * @property {number} usageCount
 * @property {number} lastUsedAt
 */
export interface PromoCodeUsage extends Entity {
  promoCodeId: string;
  usageCount: number;
  lastUsedAt: number;
  pid: string;
}

export const findPromoUsageByUser = (pid: string, promoCodeId: string): TE.TaskEither<Error, O.Option<PromoCodeUsage>> =>
  callFunction(AWSPromoCodeUsage.findById)(config.awsConfig!, `${pid}_${promoCodeId}`);

export const updatePromoCodeUsage = (promoCodeUsage: PromoCodeUsage): TE.TaskEither<Error, string> =>
  callFunction(AWSPromoCodeUsage.updatePromoCodeUsage)(config.awsConfig!, promoCodeUsage);

export const addPromoCodeUsage = (promoCodeUsage: PromoCodeUsage): TE.TaskEither<Error, string> =>
  callFunction(AWSPromoCodeUsage.addPromoCodeUsage)(config.awsConfig!, promoCodeUsage);
