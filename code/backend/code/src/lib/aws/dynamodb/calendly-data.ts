import { Option, fromNullable, isSome, none } from "fp-ts/lib/Option";
import { IConfig } from "../config";
import { IFilterData, SortKey, createDocument, findByPartitionKey, queryByAttr, updateDocument } from ".";
import { CalendlyData } from "../../entities/calendly-data";
import { CalendlyEventType } from "../../constants";

/*
 * attr1 (string) - discussionId
 * attr2 (string) - explorerId_guideId
 * attr4 (number) - createdAt
 * attr3 (string) - calendlyEventId
 */
export async function findById(config: IConfig, id: string): Promise<Option<CalendlyData>> {
  return fromNullable(await findByPartitionKey(config, id, SortKey.CalendlyData) as CalendlyData);
}
export async function createCalendlyData(config: IConfig, calendlyData: CalendlyData) {
  const document: Record<string, any> = { ...calendlyData };
  document._pk = calendlyData.id;
  document._sk = SortKey.CalendlyData;
  if (calendlyData.discussionId != null) document.attr1 = calendlyData.discussionId;
  if (calendlyData.explorerId != null && calendlyData.guideId) document.attr2 = `${calendlyData.explorerId}_${calendlyData.guideId}`;
  document.attr4 = calendlyData.createdAt;
  if (calendlyData.calendlyEventId != null) document.attr3 = calendlyData.calendlyEventId;

  await createDocument(config, document);
}
export async function findAllByDiscussionId(config: IConfig, discussionId: string): Promise<CalendlyData[]> {
  const items = await queryByAttr(config, 'attr1', discussionId, SortKey.CalendlyData, '#attr = :attrValue', 'attr1-index');

  const calendlyData: CalendlyData[] = [];
  for (const item of items) {
    const fixedDiscussion = fromNullable(item as CalendlyData);
    if (isSome(fixedDiscussion)) {
      calendlyData.push(fixedDiscussion.value);
    }
  }

  return calendlyData;
}
export async function findByCalendlyEventId(config: IConfig, calendlyEventId: string, type: CalendlyEventType): Promise<Option<CalendlyData>> {
  const filters: IFilterData = {
    expression: '#filterAttr = :filterValue',
    names: { '#filterAttr': 'event' },
    values: { ':filterValue': type }
  }
  const items = await queryByAttr(config, 'attr3', calendlyEventId, SortKey.CalendlyData, '#attr = :attrValue', 'attr3-index', filters);

  if (items == null || items.length === 0) return none;

  return fromNullable(items[0] as CalendlyData);
}
export async function updateCalendlyData(config: IConfig, calendlyData: CalendlyData, fieldsToUpdate: string[]) {
  const document: Record<string, any> = { ...calendlyData };
  document._pk = calendlyData.id;
  if (calendlyData.discussionId != null) {
    document.attr1 = calendlyData.discussionId;
    fieldsToUpdate.push('attr1');
  }
  if (calendlyData.explorerId != null && calendlyData.guideId) {
    document.attr2 = `${calendlyData.explorerId}_${calendlyData.guideId}`;
    fieldsToUpdate.push('attr2');
  }
  if (calendlyData.calendlyEventId != null) {
    document.attr3 = calendlyData.calendlyEventId;
    fieldsToUpdate.push('attr3');
  }

  await updateDocument(config, document, fieldsToUpdate);
}
