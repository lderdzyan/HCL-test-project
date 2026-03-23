import { Application, createApplication } from '../../entities/application';
import { createSurvey, Survey } from '../../entities/survey';
import { createSurveyApplication } from '../../entities/survey-application';
import { createPackage, Package } from '../../entities/package';
import { createProduct, Product } from '../../entities/product';
import { createPackageApplication, PackageApplication } from '../../entities/package-application';

export namespace MOMApplicationMigration {
  export async function addApplications(pid: string) {
    const applications: Application[] = (await import('../../../assets/applications-v5.json')).default as Application[];

    for (const item of applications) {
      await createApplication(item, pid);
    }

    // create application survey relation for mom survey json
    const app: Application = applications[0];

    const survey: Survey = await createSurvey(
      { id: 'cmdfst7us000007jrbkv2hxjh', path: '/survey/foundations.json', name: 'Worklife Fulfillment Builder' },
      pid,
    );

    await createSurveyApplication({ applicationId: app.id!, surveyId: survey.id! }, pid);

    // Product and package related stuff
    const products: Product[] = (await import('../../../assets/products-v3.json')).default as Product[];
    const packages: Package[] = (await import('../../../assets/packages-v3.json')).default as Package[];
    const packageApplications: PackageApplication[] = (await import('../../../assets/package-application-v4.json'))
      .default as PackageApplication[];

    for (const item of products) {
      await createProduct(item, pid);
    }
    for (const item of packages) {
      await createPackage(item, pid);
    }
    for (const item of packageApplications) {
      await createPackageApplication(item, pid);
    }
  }
}
