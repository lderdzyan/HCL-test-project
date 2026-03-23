import { createPackage, Package } from '../../entities/package';
import { createProduct, Product } from '../../entities/product';
import { createPackageApplication, PackageApplication } from '../../entities/package-application';

export namespace WlfPackageMigration {
  export async function addPackageProduct(pid: string) {
    const products: Product[] = (await import('../../../assets/products-v2.json')).default as Product[];
    const packages: Package[] = (await import('../../../assets/packages-v2.json')).default as Package[];
    const packageApplications: PackageApplication[] = (await import('../../../assets/package-application-v3.json'))
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
