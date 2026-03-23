import { Option, fromNullable, isSome } from "fp-ts/lib/Option";
import { IConfig } from "../config";
import { Package } from "../../entities/package";
import * as TE from 'fp-ts/TaskEither';
import { DeletedSortKey, IFilterData, SortKey, batchGetItem, createDocument, deleteByPartitionKey, doDelete, doQuery, findByPartitionKey, queryByAttr, updateDocument } from ".";

/*
 * attr1 (string) - mainPackageId
 * attr3 (string) - createdBy
 * attr4 (number) - createdAt
 */
export async function findById(config: IConfig, id: string): Promise<Option<Package>> {
  return fromNullable(await findByPartitionKey(config, id, SortKey.Package) as Package);
}

export async function createPackage(config: IConfig, data: Package) {
  const document: Record<string, any> = { ...data };
  document._pk = data.id;
  document._sk = SortKey.Package;
  document.attr3 = data.createdBy;
  document.attr4 = data.createdAt;
  if (data.mainPackageId != null) document.attr1 = data.mainPackageId;

  await createDocument(config, document);
}

export async function createDeletedPackage(config: IConfig, data: Package) {
  const document: Record<string, any> = { ...data };
  document._pk = data.id;
  document._sk = DeletedSortKey.Package;
  document.attr3 = data.createdBy;
  document.attr4 = data.createdAt;

  await createDocument(config, document);
}
export async function loadAll(config: IConfig): Promise<Package[]> {
  const filters: IFilterData = {
    expression: 'attribute_not_exists(#filterAttr) or #filterAttr = :filterValue',
    names: { '#filterAttr': 'mainPackageId' },
    values: { ':filterValue': null }
  }
  const items = await queryByAttr(
    config,
    'attr4',
    0,
    SortKey.Package,
    '#attr > :attrValue',
    'attr4-index',
    filters
  );

  const data: Package[] = [];
  for (const item of items) {
    const fixedProduct = fromNullable(item as Package);
    if (isSome(fixedProduct)) {
      data.push(fixedProduct.value);
    }
  }

  return data;
}

export async function updatePackage(config: IConfig, data: Package, fieldsToUpdate: string[]) {
  const document: Record<string, any> = { ...data };
  document._pk = data.id;
  document._sk = SortKey.Package;
  if (data.mainPackageId != null) {
    document.attr1 = data.mainPackageId;
    fieldsToUpdate.push('attr1');
  }

  await updateDocument(config, document, fieldsToUpdate);
}

export async function deletePackage(config: IConfig, id: string) {
  await deleteByPartitionKey(config, id, SortKey.Package);
}
export async function batchGet(config: IConfig, params: Record<string, any>, projections?: string[]): Promise<Record<string, any>[]> {
  return await batchGetItem(config, params, projections);
}
export async function findAllRelatedByMainId(config: IConfig, id: string): Promise<Package[]> {
  const items = await queryByAttr(config, 'attr1', id, SortKey.Package, '#attr = :attrValue', 'attr1-index');
  const payments: Package[] = [];

  for (const item of items) {
    if (item != null) {
      payments.push(item as Package);
    }
  }

  return payments;
}
export async function loadAllDuplicated(config: IConfig): Promise<Package[]> {
  const filters: IFilterData = {
    expression: 'attribute_exists(#filterAttr) AND #filterAttr <> :filterValue',
    names: { '#filterAttr': 'mainPackageId' },
    values: { ':filterValue': '' }
  }
  const items = await queryByAttr(
    config,
    'attr4',
    0,
    SortKey.Package,
    '#attr > :attrValue',
    'attr4-index',
    filters
  );

  const data: Package[] = [];
  for (const item of items) {
    const fixedProduct = fromNullable(item as Package);
    if (isSome(fixedProduct)) {
      data.push(fixedProduct.value);
    }
  }

  return data;
}
export const deletePackageTask = (config: IConfig, id: string): TE.TaskEither<Error, string> =>
  doDelete(config, id, SortKey.Package);
