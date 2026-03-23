import { isNone, Option } from "fp-ts/lib/Option";
import { findPackageById, Package } from "../../entities/package";
import { Logger } from "../../logger";
import { findPackageAppllicationById, PackageApplication, updatePackageApplication } from "../../entities/package-application";

export namespace ChangeProductInPackageMigration {
  export async function changePackageForApplication(applicationPackageId: string, packageId: string) {
    const packageO: Option<Package> = await findPackageById(packageId);

    if (isNone(packageO)) {
      Logger.info(`Package not found with id: ${packageId}`);
      return;
    }
    const applicationO: Option<PackageApplication> = await findPackageAppllicationById(applicationPackageId);

    if (isNone(applicationO)) {
      Logger.info(`PackateApplication not found with id: ${applicationPackageId}`);
      return;
    }
    applicationO.value.packageId = packageId;
    await updatePackageApplication(applicationO.value, ['packageId']);

    Logger.info('PackateApplication updated');

  }
}
