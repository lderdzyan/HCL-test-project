import { Application, loadApplications } from '../../entities/application';
import { Package, loadAllPackages } from '../../entities/package';
import { PackageApplication, createPackageApplication } from '../../entities/package-application';

export namespace PackageApplicationController {
  export async function savePackageApplications(pid: string) {
    const items = (await import('../../../assets/package-application.json')).default;

    const packages: Package[] = await loadAllPackages();
    const applications: Application[] = await loadApplications();

    for (const item of items) {
      const pack: Package | undefined = packages.find(i => i.name === item.packageName);
      const apps: string[] = applications.filter(i => item.applicationName.includes(i.name!)).map(i => i.id!);
      if (pack != null) {
        const packageApplication: PackageApplication = {
          packageId: pack.id!,
          applicationsId: apps
        };

        await createPackageApplication(packageApplication, pid);
      }
    }
  }
}
