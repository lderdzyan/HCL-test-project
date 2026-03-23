import { callFunction } from '..';
import { Entity } from '../../entity';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import * as AWSPromoPackagesAssigned from '../../aws/dynamodb/promo-service/promo-packages-assigned';
import config from '../../../config';

export type PackageAssignData = { packageId?: string; mainPackageId: string };

/**
 * {@link Entity}
 * @property {string} packageId
 * @property {string} mainPackageId
 */
export interface PromoPackagesAssigned extends Entity {
  packageId: string;
  mainPackageId: string;
}

export const loadAllByPromoId = (promoId: string): TE.TaskEither<Error, PromoPackagesAssigned[]> =>
  callFunction(AWSPromoPackagesAssigned.findAssignedByPromoId)(config.awsConfig!, promoId);

export const getPromoAssignedById = (id: string, packageId: string): TE.TaskEither<Error, O.Option<PromoPackagesAssigned>> =>
  callFunction(AWSPromoPackagesAssigned.findById)(config.awsConfig!, id, packageId);

export const loadByPackageAndMainPackage = (packageId: string, mainPackageId: string): TE.TaskEither<Error, PromoPackagesAssigned[]> =>
  callFunction(AWSPromoPackagesAssigned.findByPackageAndMainPackage)(config.awsConfig!, packageId, mainPackageId);
