import { PackageController } from '../../controllers/package';
import { PromoCodeController } from '../../controllers/promo-code';
import { PromoType } from '../../entities/promo-service/promo-code';

export namespace PromoCodeMigration {
  export async function addPromoCodeUsage(personId: string) {
    const items: any = (await import('../../../assets/promo-codes1.json')).default;

    const packages = await PackageController.loadAll();
    const packagesMap: Record<string, PackageController.PackageInfo> = {};
    packages.forEach((item) => {
      packagesMap[item.name] = item;
    });

    for (const item of items) {
      const products = [];
      for (const pr of packagesMap[item.packageName].products!) {
        if (pr.amount == 0) {
          products.push({
            id: pr.id,
            amount: 0,
          });
        } else {
          const discount = (pr.amount! * item.discountPercent) / 100;
          products.push({
            id: pr.id,
            amount: pr.amount! - discount,
          });
        }
      }
      item['assign'] = [
        {
          parentPackageId: packagesMap[item.packageName].id,
          products,
        },
      ];
      item['type'] = PromoType.Package;
      await PromoCodeController.createPromoCode(item, personId);
    }
  }
}
