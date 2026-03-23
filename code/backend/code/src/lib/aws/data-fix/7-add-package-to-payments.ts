import { fromNullable, isSome } from "fp-ts/lib/Option";
import { createProduct, Product } from "../../entities/product";
import { IConfig } from "../config";
import { IFilterData, queryByAttr, SortKey } from "../dynamodb";
import { PaymentStatus, ProductShortName } from "../../constants";
import { Logger } from "../../logger";
import { createPackage } from "../../entities/package";
import { Payment, updatePayment } from "../../entities/payment";

export namespace AddPackageToPaymentMigration {

  const id_product_10 = 'clzl3d3e300000clida0ghago';
  const id_product_20 = 'clzl3g1s700010clieixubfov';
  const id_package_10 = 'clzl3h7x500030clihin99uzu';
  const id_package_20 = 'clzl3gxfz00020cli9ihz1ms6';
  const id_package_30 = 'clzkx08zf00010cidhoo33kla';

  export async function addPackageToPayment(config: IConfig) {
    const inventory_30 = (await getProducts(config)).find(item => item.shortName === ProductShortName.Survey);
    const payments = await getAllPaymentsWithoutPackage(config);

    if (inventory_30 == null || payments == null) {
      Logger.info('No Product found or no payment without packageId found.');
      return;
    }

    await createProducts(inventory_30);
    await createPackages(inventory_30.id!, inventory_30.createdBy!);

    Logger.info(`Found ${payments.length} items to update.`);
    for (const payment of payments) {
      if (payment != null && payment.status === PaymentStatus.Done && payment.amount != null) {
        switch (payment.amount) {
          case 10:
            payment.packageId = id_package_10;
            break;
          case 20:
            payment.packageId = id_package_20;
            break;
          case 30:
            payment.packageId = id_package_30;
            break;
        }
        await updatePayment(payment, ['packageId']);
      }
    }
    Logger.info('Done answerDetails updated.');

  }

  async function getProducts(config: IConfig): Promise<Product[]> {
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

  async function getAllPaymentsWithoutPackage(config: IConfig): Promise<Payment[]> {
    const filters: IFilterData = {
      expression: 'attribute_not_exists(#filterAttr) or #filterAttr = :filterValue',
      names: { '#filterAttr': 'packageId' },
      values: { ':filterValue': null }
    }
    const items = await queryByAttr(config, 'attr4', 0, SortKey.Payment, '#attr > :attrValue', 'attr4-index', filters);

    const payments: Payment[] = [];
    for (const item of items) {
      const fixedData = fromNullable(item as Payment);
      if (isSome(fixedData)) {
        payments.push(fixedData.value);
      }
    }

    return payments;
  }

  async function createProducts(inventory_30: Product) {
    await createProduct({
      id: id_product_10,
      name: inventory_30.name,
      description: inventory_30.description,
      productId: inventory_30.productId,
      shortName: inventory_30.shortName,
      type: inventory_30.type,
      personId: inventory_30.personId,
      amount: 10,
      productTaxCode: inventory_30.productTaxCode,
      productType: inventory_30.productType
    }, inventory_30.createdBy!);

    await createProduct({
      id: id_product_20,
      name: inventory_30.name,
      description: inventory_30.description,
      productId: inventory_30.productId,
      shortName: inventory_30.shortName,
      type: inventory_30.type,
      personId: inventory_30.personId,
      amount: 20,
      productTaxCode: inventory_30.productTaxCode,
      productType: inventory_30.productType
    }, inventory_30.createdBy!);
  }

  async function createPackages(id_product_30: string, pid: string) {
    await createPackage({
      id: id_package_30,
      name: 'Meaningful Work Inventory',
      description: 'Take the meaningful work inventory, keep track of your responses, and view your results about what is meaningful to you in the workplace.',
      productId: [id_product_30]
    }, pid);

    await createPackage({
      id: id_package_20,
      name: 'Meaningful Work Inventory',
      description: 'Take the meaningful work inventory, keep track of your responses, and view your results about what is meaningful to you in the workplace.',
      productId: [id_product_20]
    }, pid);

    await createPackage({
      id: id_package_10,
      name: 'Meaningful Work Inventory',
      description: 'Take the meaningful work inventory, keep track of your responses, and view your results about what is meaningful to you in the workplace.',
      productId: [id_product_10]
    }, pid);
  }
}
