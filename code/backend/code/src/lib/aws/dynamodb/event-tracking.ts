import { fromNullable, isSome } from 'fp-ts/lib/Option';
import { createDocument, doQuery, IFilterData, queryByAttr, queryByAttrBetween, SortKey, updateDocument } from '.';
import { EventTracking, EventType } from '../../entities/event-tracking';
import { IConfig } from '../config';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import * as TE from 'fp-ts/TaskEither';

/*
 * ddbTable (string) - msinfraops-events-{env}
 * attr1 (string) - personId
 * attr2 (string) - customKey
 * attr4 (number) - createdAt
 */
export async function create(config: IConfig, eventTracking: EventTracking) {
  const document: Record<string, any> = { ...eventTracking };
  document._pk = eventTracking.id;
  document._sk = eventTracking.type;
  document.attr1 = eventTracking.personId;
  document.attr4 = eventTracking.createdAt;
  if (eventTracking.customKey) document.attr2 = eventTracking.customKey;

  await createDocument({ ...config, ddbTable: config.ddbTables.eventTracking }, document);
}
export async function findAllOfType(
  config: IConfig,
  startOfDate: number,
  endOfDate: number,
  sortKey: EventType,
): Promise<EventTracking[]> {
  const items = await queryByAttrBetween({
    awsConfig: { ...config, ddbTable: config.ddbTables.eventTracking },
    attrName: 'attr4',
    value1: startOfDate,
    value2: endOfDate,
    sortKeyValue: sortKey,
    expression: '#attr BETWEEN :attrValue1 AND :attrValue2',
    index: 'attr4-index',
  });
  const events: EventTracking[] = [];

  for (const item of items) {
    const fixedProduct = fromNullable(item as EventTracking);
    if (isSome(fixedProduct)) {
      events.push(fixedProduct.value);
    }
  }

  return events;
}
export async function findAllByCustomKey(
  config: IConfig,
  customKey: string,
  sortKey: EventType,
): Promise<EventTracking[]> {
  const items = await queryByAttr(
    { ...config, ddbTable: config.ddbTables.eventTracking },
    'attr2',
    customKey,
    sortKey,
    '#attr = :attrValue',
    'attr2-index',
  );
  const events: EventTracking[] = [];

  for (const item of items) {
    const fixedProduct = fromNullable(item as EventTracking);
    if (isSome(fixedProduct)) {
      events.push(fixedProduct.value);
    }
  }

  return events;
}
export async function findAllByCustomKeyStartsWith(
  config: IConfig,
  customKey: string,
  sortKey: EventType,
): Promise<EventTracking[]> {
  const items = await queryByAttr(
    { ...config, ddbTable: config.ddbTables.eventTracking },
    'attr2',
    customKey,
    sortKey,
    'begins_with(#attr, :attrValue)',
    'attr2-index',
  );
  const events: EventTracking[] = [];

  for (const item of items) {
    const fixedProduct = fromNullable(item as EventTracking);
    if (isSome(fixedProduct)) {
      events.push(fixedProduct.value);
    }
  }

  return events;
}
export async function findAllOfTypeByPersonIdWithoutName(
  config: IConfig,
  personId: string,
  sortKey: EventType,
): Promise<EventTracking[]> {
  const filters: IFilterData = {
    expression: 'attribute_not_exists(#filterAttr) or #filterAttr = :filterValue',
    names: { '#filterAttr': 'firstName' },
    values: { ':filterValue': '' },
  };
  const items = await queryByAttr(
    { ...config, ddbTable: config.ddbTables.eventTracking },
    'attr1',
    personId,
    sortKey,
    '#attr = :attrValue',
    'attr1-index',
    filters,
  );
  const events: EventTracking[] = [];

  for (const item of items) {
    const fixedProduct = fromNullable(item as EventTracking);
    if (isSome(fixedProduct)) {
      events.push(fixedProduct.value);
    }
  }

  return events;
}
export async function update(config: IConfig, eventTracking: EventTracking, fields: string[]) {
  const document: Record<string, any> = { ...eventTracking };
  document._pk = eventTracking.id;
  document._sk = eventTracking.type;

  if (fields.includes('customKey')) {
    document.attr2 = eventTracking.customKey!;
    fields = [...fields, 'attr2'];
  }

  await updateDocument({ ...config, ddbTable: config.ddbTables.eventTracking }, document, fields);
}
export const findByPersonIdForMRAnalytics = (
  config: IConfig,
  personId: string,
  startOfDate: number,
  endOfDate: number,
): TE.TaskEither<Error, EventTracking[]> =>
  doQuery<EventTracking>(
    config,
    new QueryCommand({
      TableName: config.ddbTables.eventTracking,
      IndexName: 'attr1-index',
      KeyConditionExpression: `#sk = :sortKey AND #attr = :attrValue`,
      FilterExpression: '#created BETWEEN :attrValue1 AND :attrValue2',
      ExpressionAttributeNames: { '#sk': '_sk', '#attr': 'attr1', '#created': 'createdAt' },
      ExpressionAttributeValues: {
        ':sortKey': EventType.MRAnalyticsEvent,
        ':attrValue': personId,
        ':attrValue1': startOfDate,
        ':attrValue2': endOfDate,
      },
    }),
  );
