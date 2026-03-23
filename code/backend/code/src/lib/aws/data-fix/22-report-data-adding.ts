import { createEventTracking, EventTracking, EventType } from '../../entities/event-tracking';
import { Package } from '../../entities/package';
import { Payment } from '../../entities/payment';
import { Person } from '../../entities/person';
import { PromoCode } from '../../entities/promo-service/promo-code';
import { UserProfile } from '../../entities/user-profile';
import { IConfig } from '../config';
import { findByPartitionKey, IFilterData, queryByAttr, SortKey } from '../dynamodb';

export namespace ReportDataAddNamespace {
  export async function addReportData(config: IConfig) {
    const promoPayments = await getAllpPaymentByPromoUsage(config);

    for (const payment of promoPayments) {
      if (payment.promoCodeId != null && payment.packageId != null && payment.createdAt! < 1747901991214) {
        //thats the first event datetime we have in db
        const users = await findUsers(config, payment.personId);
        const person = await getPersonData(config, payment.personId);
        const packageData = await getPackageData(config, payment.packageId);
        const promoCode = await getPromoData(config, payment.promoCodeId!);
        if (person != null && packageData != null && promoCode != null)
          await createEvent(users, person, packageData, promoCode, payment);
      }
    }
    console.log('done');
  }

  async function getAllpPaymentByPromoUsage(config: IConfig): Promise<Payment[]> {
    const filters: IFilterData = {
      expression: 'attribute_exists(#filterAttr) AND #filterAttr <> :filterValue',
      names: { '#filterAttr': 'promoCodeId' },
      values: { ':filterValue': '' },
    };
    const items = await queryByAttr(
      config,
      'attr4',
      1740214218000, // Thats the datetime we updated prodction.
      SortKey.Payment,
      '#attr > :attrValue',
      'attr4-index',
      filters,
      10000,
    );
    const payments: Payment[] = [];

    for (const item of items) {
      if (item != null) {
        payments.push(item as Payment);
      }
    }

    return payments;
  }

  async function getPersonData(config: IConfig, id: string): Promise<Person | undefined> {
    const item: Person | undefined = (await findByPartitionKey(config, id, SortKey.Person)) as Person;
    return item;
  }

  async function getPromoData(config: IConfig, id: string): Promise<PromoCode | undefined> {
    return (await findByPartitionKey(
      { ...config, ddbTable: config.ddbTables.promoService },
      id,
      SortKey.PromoCode,
    )) as PromoCode;
  }

  async function getPackageData(config: IConfig, id: string): Promise<Package | undefined> {
    const item: Package | undefined = (await findByPartitionKey(config, id, SortKey.Package)) as Package;
    return item;
  }

  async function findUsers(config: IConfig, pid: string): Promise<UserProfile[]> {
    const items = await queryByAttr(config, 'attr2', pid, SortKey.UserProfile, '#attr = :attrValue', 'attr2-index');
    const profiles: UserProfile[] = [];
    for (const item of items) {
      profiles.push(item as UserProfile);
    }

    return profiles;
  }

  async function createEvent(
    users: UserProfile[],
    person: Person,
    packageInfo: Package,
    promoCode: PromoCode,
    payment: Payment,
  ) {
    const eventData = {
      type: EventType.PromoCodeUsageEvent,
      email: users.length > 0 ? users[0].email! : '',
      payedAmount: payment.amount!,
      firstName: person.firstName ?? '',
      lastName: person.lastName ?? '',
      packageName: packageInfo.name,
      promoCode: promoCode.promoCode,
      paymentId: payment.id,
      customKey: payment.id,
      createdAt: payment.createdAt,
      personId: person.id!,
    } as EventTracking;
    await createEventTracking(eventData, person.id!);
  }
}
