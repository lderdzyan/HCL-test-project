import { Package } from "../../entities/package";
import { loadAllProducts, Product, updateProduct } from "../../entities/product";
import { queryByAttr, SortKey } from "../dynamodb";
import { IConfig } from '../config';
import { fromNullable, isSome } from "fp-ts/lib/Option";

export namespace AddPackageIdToProduct {
  export async function migrate(config: IConfig) {
    const packageList: Package[] = await loadAll(config);
    const productList: Product[] = await loadAllProducts();

    for (const pack of packageList) {
      const prods = productList.filter((product) => pack.productId.includes(product.id!));
      await updateProducts(prods, pack.id!);
    }
  }

  async function updateProducts(prods: Product[], packageId: string) {
    for (const product of prods) {
      product.packageId = packageId;
      await updateProduct(product, product.createdBy!, ['packageId']);
    }
  }

  export async function loadAll(config: IConfig): Promise<Package[]> {
    const items = await queryByAttr(
      config,
      'attr4',
      0,
      SortKey.Package,
      '#attr > :attrValue',
      'attr4-index'
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
}
