import { loadAllPackages, Package } from "../../entities/package";
import { findAllApplicationPackages, PackageApplication } from "../../entities/package-application";
import { PackageController } from "../../controllers/package";

export namespace ExtraPackageRemovingMigration {
  export async function findAndRemoveUnusedPackages() {
    const packagesList: Package[] = await loadAllPackages();
    const allPackageIds: string[] = packagesList.filter(id => (id != null)).map(item => item.id!);

    const packageApplication: PackageApplication[] = await findAllApplicationPackages();

    const usedPackagesList: string[] = packageApplication.map(({ packageId }) => packageId);

    const set2 = new Set(usedPackagesList);
    const needToBeRemoved = allPackageIds.filter(item => !set2.has(item));

    for (const item of needToBeRemoved) {
      await PackageController.deletePackage(item);
    }
  }
}
