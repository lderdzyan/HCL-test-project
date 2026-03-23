import { Option, fromNullable, isNone, isSome, none } from 'fp-ts/lib/Option';
import {
  Package,
  batchGetPackages,
  createDeletedPackage,
  createPackage,
  deletePackageInfo,
  findAllRelatedByMainId,
  findPackageById,
  loadAllPackages,
  updatePackage,
} from '../entities/package';
import { Product, loadAllByPackageId } from '../entities/product';
import {
  PackageApplication,
  findAllApplicationsByPackageId,
  findPackagesByApplicationId,
  updatePackageApplication,
} from '../entities/package-application';
import * as O from 'fp-ts/Option';
import * as TE from "fp-ts/TaskEither";
import { ProductController } from './product';
import { SortKey } from '../aws/dynamodb';
import { createId } from '@paralleldrive/cuid2';

export namespace PackageController {
  export type PackageInfo = Package & {
    products?: Product[];
  };

  export async function loadAll(): Promise<PackageInfo[]> {
    const packagesList: Package[] = await loadAllPackages();
    const list: PackageInfo[] = [];

    for (const item of packagesList) {
      const pInfo: PackageInfo = item;
      pInfo.products = await loadAllByPackageId(item.id!);
      list.push(pInfo);
    }

    return list;
  }

  export async function getPackageInfo(id: string): Promise<Option<PackageInfo>> {
    const packageO: Option<Package> = await findPackageById(id);

    if (isNone(packageO)) return none;

    const foundPackage: Package = packageO.value;
    const packageInfo: PackageInfo = foundPackage;
    packageInfo.products = await loadAllByPackageId(id);

    return fromNullable(packageInfo);
  }

  export async function loadAllByApplicationsId(applicationsId: string[]): Promise<PackageInfo[]> {
    const packageApplications: PackageApplication[] = await findPackagesByApplicationId(applicationsId);
    const packagesList: Package[] = await loadAllPackages();
    const list: PackageInfo[] = [];

    for (const item of packageApplications) {
      const pInfo: PackageInfo | undefined = packagesList.find((pack) => pack.id! == item.packageId!);
      if (pInfo != null) {
        pInfo.products = await loadAllByPackageId(pInfo.id!);
        list.push(pInfo);
      }
    }

    return list;
  }

  export async function deletePackage(packageId: string) {
    const packageInfo: Option<Package> = await findPackageById(packageId);
    if (isSome(packageInfo)) {
      await createDeletedPackage(packageInfo.value);
      await deletePackageInfo(packageId);
    }
  }

  export async function duplicatePackage(
    packageInfo: PackageInfo,
    newPackageId: string,
    name: string,
    description: string,
    pid: string,
    productIds: string[],
    discount?: number,
  ) {
    const packageApplication: PackageApplication[] = await findAllApplicationsByPackageId(packageInfo.id!);

    if (productIds.length == 0) return;

    // Need to delete old package and create new package, then create relation between package and application.
    const newPackage: Package = await createPackage(
      {
        name,
        id: newPackageId,
        description,
        discount: discount ?? 0,
        productId: productIds,
      },
      pid,
    );

    await deletePackage(packageInfo.id!);

    for (const app of packageApplication) {
      app.packageId = newPackage.id!;
      await updatePackageApplication(app, ['packageId']);
    }
  }

  export async function updatePackageMainInfo(id: string, name: string, description: string) {
    const packageInfo: Option<Package> = await findPackageById(id);

    if (isNone(packageInfo)) {
      return;
    }
    const pInfo: Package = packageInfo.value;

    pInfo.name = name;
    pInfo.description = description;
    await updatePackage(pInfo, ['name', 'description']);
  }

  export async function fetchMissingIds(packageIds: string[]): Promise<O.Option<string[]>> {
    const pks = packageIds.map((item) => ({ _pk: { S: item }, _sk: { S: SortKey.Package } }));

    const packages: Record<string, any>[] = await batchGetPackages(pks);
    const existingIds = packages.map((item) => item['id']['S']);
    const missingIds = packageIds.filter((id) => existingIds.indexOf(id) == -1);

    if (missingIds.length > 0) {
      return O.some(missingIds);
    }
    return O.none;
  }

  export interface IPackageDuplicationData {
    pid: string;
    id: string;
    products: [{
      id: string;
      amount: number;
    }]
  }
  export async function duplicatePackageForPromo(packageInfo: IPackageDuplicationData): Promise<O.Option<string>> {
    const mainPackageO: Option<Package> = await findPackageById(packageInfo.id);
    if (isNone(mainPackageO)) return O.none;
    // Find all products and create new ones with new prices based on old ones
    const newPackageId = createId();
    const productIdPromises = packageInfo.products.map(async (item) => {
      const newProductId = await ProductController.findAndDuplicationProduct(
        item.amount,
        packageInfo.pid,
        item.id,
        newPackageId
      );
      return isSome(newProductId) ? newProductId.value : null;
    });

    const productIds = (await Promise.all(productIdPromises)).filter(
      (id): id is string => id !== null
    );

    return await createNewPackageFromMain(mainPackageO.value, productIds, packageInfo.pid, newPackageId);
  }

  async function createNewPackageFromMain(mainPackage: Package, productIds: string[], pid: string, newPackageId: string): Promise<O.Option<string>> {
    const newPackage: Package = await createPackage(
      {
        name: mainPackage.name,
        description: mainPackage.description,
        discount: mainPackage.discount,
        productId: productIds,
        mainPackageId: mainPackage.id!,
        id: newPackageId
      },
      pid,
    );

    return O.some(newPackage.id!);
  }

  export async function getAssigned(id: string): Promise<Package[]> {
    return await findAllRelatedByMainId(id);
  }

  export const loadPackageInfo = (id: string): TE.TaskEither<Error, Option<PackageInfo>> => TE.tryCatch(
    async () => getPackageInfo(id),
    (error) => error as Error
  );
}
