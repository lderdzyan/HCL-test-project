import { EventActionType } from '../../constants';
import { EventTracking, EventType } from '../../entities/event-tracking';
import { Person } from '../../entities/person';
import { publishMessage } from '../../publish-message';
import { respond } from '../../request';
import { IConfig } from '../config';
import { findByPartitionKey, IFilterData, queryByAttr, SortKey } from '../dynamodb';

export namespace PromoReportUpdateNamesNamespace {
  export async function updateReportData(config: IConfig) {
    const promoReportData = await getAllReportDataWithoutNames(config);

    console.log(`Items size to update is ${promoReportData.length}`);
    for (const reportData of promoReportData) {
      const person = await getPersonData(config, reportData.personId);
      if (person != null && person.firstName != null && person.lastName != null) {
        console.log(reportData);
        reportData.firstName = person?.firstName!;
        reportData.lastName = person?.lastName!;
        await publishMessage(
          'event-tracking',
          respond(
            {
              e: {
                type: EventType.PromoCodeUsageEvent,
                eventTracking: reportData,
                fieldsToUpdate: ['firstName', 'lastName'],
                action: EventActionType.Update,
              },
            },
            { pid: reportData.personId },
          ),
        );
      }
    }
    console.log('done');
  }

  async function getAllReportDataWithoutNames(config: IConfig): Promise<EventTracking[]> {
    const filters: IFilterData = {
      expression: 'attribute_not_exists(#filterAttr) OR #filterAttr = :filterValue',
      names: { '#filterAttr': 'firstName' },
      values: { ':filterValue': '' },
    };
    const items = await queryByAttr(
      { ...config, ddbTable: config.ddbTables.eventTracking },
      'attr4',
      0,
      EventType.PromoCodeUsageEvent,
      '#attr > :attrValue',
      'attr4-index',
      filters,
    );
    const eventData: EventTracking[] = [];

    for (const item of items) {
      if (item != null) {
        eventData.push(item as EventTracking);
      }
    }

    return eventData;
  }

  async function getPersonData(config: IConfig, id: string): Promise<Person | undefined> {
    const item: Person | undefined = (await findByPartitionKey(config, id, SortKey.Person)) as Person;
    return item;
  }
}
