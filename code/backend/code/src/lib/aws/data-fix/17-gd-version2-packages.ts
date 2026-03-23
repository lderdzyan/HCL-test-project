import { isNone, Option } from 'fp-ts/lib/Option';
import { Application, createApplication, findApplicationByPath, loadApplications } from '../../entities/application';
import { loadAllPackages, Package } from '../../entities/package';
import { createPackageApplication, PackageApplication } from '../../entities/package-application';

export namespace SecondVersionApplicationNamespace {
  export async function createNewApplicationWithPackages(pid: string) {
    const applicationsNew: Application[] = (await import('../../../assets/applications-v2.json')).default as Application[];
    const items = (await import('../../../assets/package-application-v2.json')).default;

    for (const item of applicationsNew) {
      const app: Option<Application> = await findApplicationByPath(item.path!);
      if (isNone(app)) await createApplication(item, pid);
    }

    const applications: Application[] = await loadApplications();
    const packages: Package[] = await loadAllPackages();
    for (const item of items) {
      const apps: string[] = applications.filter(i => item.applicationName.includes(i.name!)).map(i => i.id!);
      const pack: Package | undefined = packages.find(i => i.name === item.packageName);
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
