import { fromNullable, isSome, Option } from "fp-ts/lib/Option";
import { IConfig } from "../config";
import { batchWriteCommand, createDocument, findByPartitionKey, queryByAttr, queryByAttrBetween, SortKey } from ".";
import { AvailableDates } from "../../entities/available-dates";

/*
 * attr1 (string) - guideId
 * attr2 (number) - startTime
 * attr4 (number) - createdAt
 */
export async function findById(config: IConfig, id: string): Promise<Option<AvailableDates>> {
  return fromNullable(await findByPartitionKey({ ...config, ddbTable: config.ddbTables.scheduling }, id, SortKey.AvailableDates) as AvailableDates);
}
export async function createAvailableDates(config: IConfig, availableDates: AvailableDates) {
  const document: Record<string, any> = { ...availableDates };
  document._pk = availableDates.id;
  document._sk = SortKey.AvailableDates;
  document.attr1 = availableDates.guideId;
  document.attr2 = availableDates.startTime;
  document.attr4 = availableDates.createdAt;

  await createDocument({ ...config, ddbTable: config.ddbTables.scheduling }, document);
}
export async function findAllByGuideId(config: IConfig, guideId: string): Promise<AvailableDates[]> {
  const items = await queryByAttr(
    { ...config, ddbTable: config.ddbTables.scheduling },
    'attr1', guideId, SortKey.AvailableDates, '#attr = :attrValue', 'attr1-index');

  const availableDate: AvailableDates[] = [];
  for (const item of items) {
    const fixedDiscussion = fromNullable(item as AvailableDates);
    if (isSome(fixedDiscussion)) {
      availableDate.push(fixedDiscussion.value);
    }
  }

  return availableDate;
}
export async function batchWrite(config: IConfig, params: Record<string, any>) {
  await batchWriteCommand(config, config.ddbTables.scheduling, params);
}
export async function findAllForGivenRange(config: IConfig, startOfDate: number, endOfDate: number): Promise<AvailableDates[]> {
  const items = await queryByAttrBetween({
    awsConfig: { ...config, ddbTable: config.ddbTables.scheduling },
    attrName: 'attr2',
    value1: startOfDate,
    value2: endOfDate,
    sortKeyValue: SortKey.AvailableDates,
    expression: '#attr BETWEEN :attrValue1 AND :attrValue2',
    index: 'attr2-index',
  });
  const availableDates: AvailableDates[] = [];

  for (const item of items) {
    const fixedProduct = fromNullable(item as AvailableDates);
    if (isSome(fixedProduct)) {
      availableDates.push(fixedProduct.value);
    }
  }

  return availableDates;
}
