import { Package, createPackage } from '../../entities/package';
import { Product, createProduct, loadAllProducts } from '../../entities/product';

export namespace ProductMigration {
  export async function addProducts(pid: string) {
    const products: Product[] = (await import('../../../assets/products.json')).default as Product[];
    const packages: Package[] = (await import('../../../assets/packages.json')).default as Package[];
    const productList: Product[] = await loadAllProducts();
    const allProducts: string[] = productList.map(item => item.productTaxCode);
    const existingProductsMap = productList.reduce<Record<string, string>>((map, item: Product) => {
      map[item.productTaxCode] = item.id!;
      return map;
    }, {});
    const productMap: Record<string, string> = {};

    for (const item of products) {
      if (!allProducts.includes(item.productTaxCode)) {
        const addedProduct: Product = await createProduct(item, pid);
        productMap[addedProduct.productTaxCode] = addedProduct.id!;
      } else {
        productMap[item.productTaxCode] = existingProductsMap[item.productTaxCode];
      }
    }

    for (const item of packages) {
      const productsId = [];
      if (item.productId != null) {
        for (const id of item.productId) {
          productsId.push(productMap[id]);
        }
        item.productId = productsId;
      }
      await createPackage(item, pid);
    }
  }
}
