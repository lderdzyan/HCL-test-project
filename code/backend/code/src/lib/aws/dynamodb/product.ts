import { Option, fromNullable, isSome } from "fp-ts/lib/Option";
import { SortKey, batchGetItem, createDocument, doDelete, findByPartitionKey, queryByAttr, updateDocument } from ".";
import { Product } from "../../entities/product";
import { IConfig } from "../config";
import * as TE from 'fp-ts/TaskEither';

/*
 * attr1 (string) - type
 * attr2 (string) - packageId
 * attr3 (string) - createdBy
 * attr4 (number) - createdAt
 */
export async function findById(config: IConfig, id: string): Promise<Option<Product>> {
  return fromNullable(await findByPartitionKey(config, id, SortKey.Product) as Product);
}

export async function createProduct(config: IConfig, product: Product) {
  const document: Record<string, any> = { ...product };
  document._pk = product.id;
  document._sk = SortKey.Product;
  document.attr1 = product.type;
  if (product.packageId) document.attr2 = product.packageId;
  document.attr3 = product.createdBy;
  document.attr4 = product.createdAt;

  await createDocument(config, document);
}

export async function loadAll(config: IConfig): Promise<Product[]> {
  const items = await queryByAttr(config, 'attr4', 0, SortKey.Product, '#attr > :attrValue', 'attr4-index');

  const products: Product[] = [];
  for (const item of items) {
    const fixedProduct = fromNullable(item as Product);
    if (isSome(fixedProduct)) {
      products.push(fixedProduct.value);
    }
  }

  return products;
}

export async function loadAllByPackageId(config: IConfig, packageId: string): Promise<Product[]> {
  const items = await queryByAttr(config, 'attr2', packageId, SortKey.Product, '#attr = :attrValue', 'attr2-index');

  const products: Product[] = [];
  for (const item of items) {
    const fixedProduct = fromNullable(item as Product);
    if (isSome(fixedProduct)) {
      products.push(fixedProduct.value);
    }
  }

  return products;
}

export async function batchGet(config: IConfig, params: Record<string, any>, projections?: string[]): Promise<Record<string, any>[]> {
  return await batchGetItem(config, params, projections);
}
export async function updateProduct(config: IConfig, product: Product, fieldsToUpdate: string[]) {
  const document: Record<string, any> = { ...product };
  document._pk = product.id;
  document._sk = SortKey.Product;
  if (product.packageId != null) {
    document.attr2 = product.packageId;
    fieldsToUpdate.push('attr2');
  }

  await updateDocument(config, document, fieldsToUpdate);
}
export const deleteProduct = (config: IConfig, id: string): TE.TaskEither<Error, string> =>
  doDelete(config, id, SortKey.Product);
