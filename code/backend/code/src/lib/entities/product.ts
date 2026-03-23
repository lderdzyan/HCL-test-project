import config from '../../config';
import { Entity, currentAt, currentOn } from '../entity';
import * as ASWProduct from '../aws/dynamodb/product';
import { createId } from '@paralleldrive/cuid2';
import { Option } from 'fp-ts/lib/Option';
import * as TE from 'fp-ts/TaskEither';
import { ProductShortName, ProductType } from '../constants';
import { callFunction } from '.';

/**
 * {@link Entity}
 * @property {string} name
 * @property {string} description
 * @property {number} amount
 * @property {string} personId
 * @property {string} type
 * @property {string} shortName
 * @property {string} productId - identifier used to link the product with external systems
 */

export interface Product extends Entity {
  name?: string;
  description?: string;
  amount?: number;
  productId?: string;
  personId?: string;
  type: ProductType;
  [key: string]: any;
  shortName: ProductShortName;
  productTaxCode: string;
  productType: string;
  packageId?: string;
}

export async function findProductById(id: string): Promise<Option<Product>> {
  switch (config.deploymenEnv) {
    case 'aws':
      return ASWProduct.findById(config.awsConfig!, id);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}

export async function createProduct(product: Product, pid: string): Promise<Product> {
  product.id = product.id ?? createId();
  product.createdBy = pid;
  product.createdAt = currentAt();
  product.createdOn = currentOn();
  product.updatedBy = product.createdBy;
  product.updatedAt = product.createdAt;
  product.updatedOn = product.createdOn;

  switch (config.deploymenEnv) {
    case 'aws':
      await ASWProduct.createProduct(config.awsConfig!, product);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return product;
}
export async function loadAllProducts(): Promise<Product[]> {
  switch (config.deploymenEnv) {
    case 'aws': return ASWProduct.loadAll(config.awsConfig!);
    case 'azure': throw Error('Not implemented yet.')
  }
}
export async function loadAllByPackageId(packageId: string): Promise<Product[]> {
  switch (config.deploymenEnv) {
    case 'aws': return ASWProduct.loadAllByPackageId(config.awsConfig!, packageId);
    case 'azure': throw Error('Not implemented yet.')
  }
}
export async function batchGetProducts(params: Record<string, any>, projections?: string[]): Promise<Record<string, any>[]> {
  return await ASWProduct.batchGet(config.awsConfig!, params, projections);
}
export async function updateProduct(product: Product, pid: string, fieldsToUpdate: string[]): Promise<Product> {
  if (product.id == null) throw Error('Product must have `id`.');

  product.updatedBy = pid;
  product.updatedOn = currentOn();
  product.updatedAt = currentAt();

  switch (config.deploymenEnv) {
    case 'aws':
      await ASWProduct.updateProduct(config.awsConfig!, product, fieldsToUpdate);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return product;
}
export const deleteProduct = (id: string): TE.TaskEither<Error, string> =>
  callFunction(ASWProduct.deleteProduct)(config.awsConfig!, id);
