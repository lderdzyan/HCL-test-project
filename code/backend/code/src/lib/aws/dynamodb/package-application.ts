import { fromNullable, Option } from 'fp-ts/lib/Option';
import { SortKey, createDocument, findByPartitionKey, queryByAttr, updateDocument } from '.';
import { PackageApplication } from '../../entities/package-application';
import { IConfig } from '../config';
/*
 * attr1 (string) - applicationId
 * attr2 (string) - packageId
 * attr3 (string) - createdBy
 * attr4 (number) - createdAt
 */
export async function findById(config: IConfig, id: string): Promise<Option<PackageApplication>> {
  return fromNullable(await findByPartitionKey(config, id, SortKey.ApplicationPackage) as PackageApplication);
}
export async function findAllByApplicationsId(config: IConfig, applicationsIdKey: string): Promise<PackageApplication[]> {
  const items = await queryByAttr(
    config,
    'attr1',
    applicationsIdKey,
    SortKey.ApplicationPackage,
    '#attr = :attrValue',
    'attr1-index',
  );
  const applicationPackages: PackageApplication[] = [];

  for (const item of items) {
    applicationPackages.push(item as PackageApplication);
  }

  return applicationPackages;
}
export async function findAllByPackageId(config: IConfig, packageId: string): Promise<PackageApplication[]> {
  const items = await queryByAttr(
    config,
    'attr2',
    packageId,
    SortKey.ApplicationPackage,
    '#attr = :attrValue',
    'attr2-index',
  );
  const applicationPackages: PackageApplication[] = [];

  for (const item of items) {
    applicationPackages.push(item as PackageApplication);
  }

  return applicationPackages;
}
export async function findAllApplicationPackages(config: IConfig): Promise<PackageApplication[]> {
  const items = await queryByAttr(config, 'attr4', 0, SortKey.ApplicationPackage, '#attr > :attrValue', 'attr4-index');
  const applicationPackages: PackageApplication[] = [];

  for (const item of items) {
    applicationPackages.push(item as PackageApplication);
  }

  return applicationPackages;
}
export async function createPackageApplication(config: IConfig, packageApp: PackageApplication, appicationsIdKey: string) {
  const document: Record<string, any> = { ...packageApp };
  document._pk = packageApp.id;
  document._sk = SortKey.ApplicationPackage;
  document.attr1 = appicationsIdKey;
  document.attr2 = packageApp.packageId;
  document.attr3 = packageApp.createdBy;
  document.attr4 = packageApp.createdAt;

  await createDocument(config, document);
}
export async function updatePackageApplication(config: IConfig, data: PackageApplication, fieldsToUpdate: string[], appicationsIdKey?: string) {
  const document: Record<string, any> = { ...data };
  document._pk = data.id;
  document._sk = SortKey.ApplicationPackage;
  if (fieldsToUpdate.includes('packageId')) {
    document.attr2 = document.packageId;
    fieldsToUpdate.push('attr2');
  }

  await updateDocument(config, document, fieldsToUpdate);
}
