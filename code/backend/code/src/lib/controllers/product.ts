import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import { Option } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/function';
import { SortKey } from '../aws/dynamodb';
import { Product, batchGetProducts, createProduct, findProductById, updateProduct } from '../entities/product';

export namespace ProductController {
  export async function addProduct(product: Product, pid: string) {
    await createProduct(product, pid);
  }

  export function createEntityFromObject(data: Record<string, any>, product: Product, excludeKeys: string[]) {
    const allKeys: string[] = Object.keys(data);
    const neededKeys: string[] = allKeys.filter((item) => !excludeKeys.includes(item));

    for (const key of neededKeys) product[key] = data[key];

    return product;
  }

  // This function is duplicating and returning the product if the price was updated, if not it's returning old id
  export async function duplicateProduct(amount: number, pid: string, newPackageId: string, product?: Product): Promise<O.Option<string>> {
    if (product != null) {
      const productId: string = product.id!;
      if (productId != null) {
        const newProduct = await createProduct(
          {
            name: product.name,
            description: product.description,
            amount,
            productId: product.productId,
            type: product.type,
            shortName: product.shortName,
            productTaxCode: product.productTaxCode,
            productType: product.productType,
            packageId: newPackageId,
          },
          pid,
        );

        return O.some(newProduct.id!);
      }
      return O.some(productId);
    }

    return O.none;
  }

  export const updateProductPrice = (id: string, price: number, pid: string): TE.TaskEither<Error, Product> =>
    pipe(
      getPoductById(id),
      TE.chain(O.fold(() => TE.left<Error, Product>(new Error('Product not exists.')), TE.right<Error, Product>)),
      TE.chain((product) => {
        product.amount = price;
        return updateProductById(product, pid, ['amount']);
      }),
    );

  export async function findAndDuplicationProduct(amount: number, pid: string, id: string, newPackageId: string): Promise<O.Option<string>> {
    const product: O.Option<Product> = await findProductById(id);

    if (O.isNone(product)) return O.none;

    return await duplicateProduct(amount, pid, newPackageId, product.value);
  }

  export async function fetchMissingIds(productIds: string[]): Promise<O.Option<string[]>> {
    const pks = productIds.map((item) => ({ _pk: { S: item }, _sk: { S: SortKey.Product } }));

    const products: Record<string, any>[] = await batchGetProducts(pks);
    const existingIds = products.map((item) => item['id']['S']);
    const missingIds = productIds.filter((id) => existingIds.indexOf(id) == -1);

    if (missingIds.length > 0) {
      return O.some(missingIds);
    }
    return O.none;
  }

  export const getPoductById = (id: string): TE.TaskEither<Error, Option<Product>> =>
    TE.tryCatch(
      async () => await findProductById(id),
      (error) => error as Error,
    );

  const updateProductById = (product: Product, pid: string, fieldsToUpdate: string[]): TE.TaskEither<Error, Product> =>
    TE.tryCatch(
      async () => await updateProduct(product, pid, fieldsToUpdate),
      (error) => error as Error,
    );
}
