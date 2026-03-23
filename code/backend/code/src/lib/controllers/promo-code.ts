import * as A from 'fp-ts/Array';
import { pipe } from 'fp-ts/lib/function';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import {
  createPromoCodeAndAssign,
  getPromoCodeById,
  loadAllActivePromoCodes,
  loadAllPromoCodes,
  PromoCode,
  PromoStatus,
  PromoType,
  updateApplyOnlyRevenueAmount,
  updateApplyOnlyUsage,
  updateApplyPromoCode,
  updateApplyRevenueAndUsageCount,
} from '../entities/promo-service/promo-code';
import {
  addPromoCodeUsage,
  findPromoUsageByUser,
  updatePromoCodeUsage,
} from '../entities/promo-service/promo-code-usage';
import {
  getPromoAssignedById,
  loadAllByPromoId,
  PackageAssignData,
  PromoPackagesAssigned,
} from '../entities/promo-service/promo-packages-assigned';
import { PackageController } from './package';
import { ProductController } from './product';
import { LoadPromoCodesDTO } from '../../functions/promo-service/dto/LoadPromoCodeDTO';
import { currentAt } from '../entity';
import { asUtcInTz } from '../utils/date-utils';
import config from '../../config';

export namespace PromoCodeController {
  export type PackagePromo = {
    packageId?: string;
    parentPackageId: string;
    products: [{ id: string; amount: number }];
  };

  export interface CreatePromoCodeDTO {
    promoCode: string;
    status: PromoStatus;
    description?: string;
    discountPercent?: number;
    discountAmount?: number;
    usageCount?: number;
    usageCountPerUser?: number;
    revenueAmount?: number;
    startDate?: number;
    expiration?: number;
    type: PromoType;
    assign: PackagePromo[];
  }

  export const applyPromoCode = (
    codeId: string,
    personId: string,
    packageId: string,
    payedAmount: number,
  ): TE.TaskEither<Error, string> =>
    pipe(
      getPromoCodeById(codeId),
      TE.chain(
        O.fold(() => TE.left<Error, PromoCode>(new Error('Promo code not exists.')), TE.right<Error, PromoCode>),
      ),
      TE.chain((promoCode) =>
        pipe(
          getPromoAssignedById(promoCode.id!, packageId),
          TE.chain(
            O.fold(
              () => TE.left<Error, PromoPackagesAssigned>(new Error('Promo package assigned not exists.')),
              TE.right<Error, PromoPackagesAssigned>,
            ),
          ),
          TE.chain((promoPackage) =>
            pipe(
              PackageController.loadPackageInfo(promoPackage.mainPackageId),
              TE.chain(
                O.fold(
                  () => TE.left<Error, PackageController.PackageInfo>(new Error('Package not found')),
                  TE.right<Error, PackageController.PackageInfo>,
                ),
              ),
              TE.chain((packageInfo) => {
                const totalPrice = packageInfo.products!.reduce((sum, item) => sum + item.amount!, 0);
                const remainingAmount = totalPrice - payedAmount;

                // We need to check 4 cases: 1. maxRevenue and maxUsage exists, 2. maxRevenu exists, 3. maxUsage exists, 4. none of them exists
                if (promoCode.revenueAmount) {
                  return promoCode.usageCount
                    ? updateApplyRevenueAndUsageCount(promoCode, remainingAmount)
                    : updateApplyOnlyRevenueAmount(promoCode, remainingAmount);
                }

                return promoCode.usageCount
                  ? updateApplyOnlyUsage(promoCode, remainingAmount)
                  : updateApplyPromoCode(promoCode, remainingAmount);
              }),
            ),
          ),
        ),
      ),
      TE.chain((promoCode) =>
        pipe(
          findPromoUsageByUser(personId, promoCode.id!),
          TE.chain((promoCodeUsage) => {
            if (O.isNone(promoCodeUsage)) {
              return addPromoCodeUsage({
                pid: personId,
                promoCodeId: promoCode.id!,
                lastUsedAt: Date.now(),
                usageCount: 1,
              });
            } else {
              return updatePromoCodeUsage(promoCodeUsage.value);
            }
          }),
        ),
      ),
    );

  export const createPackages = (assign: PackagePromo[], pid: string): TE.TaskEither<Error, PackageAssignData[]> =>
    pipe(
      A.traverse(TE.ApplicativePar)((item: PackagePromo) =>
        pipe(
          TE.tryCatch(
            async () =>
              await PackageController.duplicatePackageForPromo({
                pid,
                id: item.parentPackageId,
                products: item.products,
              }),
            (reason) => reason as Error,
          ),
          TE.map((packageId) => {
            let packageData: PackageAssignData;
            if (O.isSome(packageId)) {
              packageData = { packageId: packageId.value, mainPackageId: item.parentPackageId };
            } else {
              packageData = { packageId: undefined, mainPackageId: item.parentPackageId };
            }

            return packageData;
          }),
        ),
      )(assign),
      TE.map((packageIds) => packageIds.filter((id) => id.packageId != null)),
    );

  export const updatePackageProducts = (
    assign: PackagePromo[],
    pid: string,
  ): TE.TaskEither<Error, PackageAssignData[]> =>
    pipe(
      A.traverse(TE.ApplicativePar)((item: PackagePromo) =>
        pipe(
          A.traverse(TE.ApplicativePar)((product: { id: string; amount: number }) =>
            ProductController.updateProductPrice(product.id, product.amount, pid),
          )(item.products),
          TE.map(() => ({ packageId: item.packageId, mainPackageId: item.parentPackageId }) as PackageAssignData),
        ),
      )(assign),
    );

  export const createPromoCode = async (promoCodeData: CreatePromoCodeDTO, personId: string) =>
    pipe(
      PromoCodeController.createPackages(promoCodeData.assign, personId),
      TE.chain((packageIds) =>
        pipe(
          TE.of<never, PromoCode>(
            (() => ({
              description: promoCodeData.description,
              expiration: promoCodeData.expiration,
              status: promoCodeData.status ?? PromoStatus.Active,
              leftCount: promoCodeData.usageCount,
              promoCode: promoCodeData.promoCode,
              type: promoCodeData.type,
              usageCount: promoCodeData.usageCount,
              discountAmount: promoCodeData.discountAmount,
              discountPercent: promoCodeData.discountPercent,
              revenueAmount: promoCodeData.revenueAmount,
              startDate: promoCodeData.startDate,
              usageCountPerUser: promoCodeData.usageCountPerUser,
            }))(),
          ),
          TE.chain((promoCode) => createPromoCodeAndAssign(promoCode, packageIds, personId)),
        ),
      ),
    )();

  const isMainPackageConnectedToAnyActivePromoCode = (mainPackageId: string): TE.TaskEither<Error, boolean> =>
    pipe(
      loadAllActivePromoCodes(),
      TE.chain((promoCodes) => checkIfConnected(promoCodes, mainPackageId)),
    );
  const checkIfConnected = (promoCodes: PromoCode[], mainPackageId: string): TE.TaskEither<Error, boolean> => {
    const go = (codes: PromoCode[]): TE.TaskEither<Error, boolean> => {
      if (codes.length === 0) {
        return TE.right(false);
      }

      const [head, ...tail] = codes;

      return pipe(
        loadAllByPromoId(head.id!),
        TE.chain((assigned) => (assigned.some((a) => a.mainPackageId === mainPackageId) ? TE.right(true) : go(tail))),
      );
    };

    return go(promoCodes);
  };

  export const isMainPackageIdUsedInActivePromoCode = async (mainPackageId: string): Promise<boolean> => {
    const result = await isMainPackageConnectedToAnyActivePromoCode(mainPackageId)();

    if (E.isRight(result)) {
      return result.right;
    } else {
      throw result.left;
    }
  };

  export const loadPromoCodes = (filtration: LoadPromoCodesDTO): TE.TaskEither<Error, PromoCode[]> =>
    pipe(
      validateFiltration(filtration),
      TE.chain((filtration) => loadAllPromoCodes(filtration.startDateTime!, filtration.endDateTime!)),
    );

  export const loadExpredPromoCodes = (): TE.TaskEither<Error, PromoCode[]> =>
    pipe(
      loadAllActivePromoCodes(),
      TE.map((promoCodes) =>
        promoCodes.filter((promo) => {
          const { revenueAmount, usedRevenue, expiration, leftCount } = promo;
          return (
            (revenueAmount != null && usedRevenue != null && usedRevenue >= revenueAmount) ||
            (expiration != null && expiration < currentAt()) ||
            (leftCount != null && leftCount === 0)
          );
        }),
      ),
    );

  export const loadPromoCodeById = async (promoCodeId: string): Promise<PromoCode | undefined> => {
    const result = await getPromoCodeById(promoCodeId)();

    if (result._tag === 'Right') {
      return O.toNullable(result.right) ?? undefined;
    } else {
      console.error('Error fetching promo code:', result.left);
      return undefined;
    }
  };

  const validateFiltration = (filtration: LoadPromoCodesDTO) => {
    const newFiltration = {
      startDateTime: 0,
      endDateTime: 0,
    };
    if (filtration == null || !filtration.startDate) {
      newFiltration.startDateTime = 0;
    } else {
      newFiltration.startDateTime = asUtcInTz(filtration.startDate, config.intranetReportTimezon);
    }

    let end =
      filtration != null && filtration.endDate
        ? filtration.endDate
        : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(); // add 2 more days
    newFiltration.endDateTime = asUtcInTz(end, config.intranetReportTimezon);

    return TE.right(newFiltration);
  };
}
