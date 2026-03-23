import { Option, fromNullable, isSome } from "fp-ts/lib/Option";
import { IConfig } from "../config";
import { IFilterData, SortKey, createDocument, findByPartitionKey, queryByAttr, queryByAttrBetween, removeAttr, updateDocument } from ".";
import { GuidedDiscussion } from "../../entities/guided-discussion";
import { GuidedDiscussionStatus } from "../../constants";

/*
 * attr1 (string) - status
 * attr2 (string) - guideId
 * attr3 (string) - explorerId
 * attr4 (number) - createdAt
 */
export async function findById(config: IConfig, id: string): Promise<Option<GuidedDiscussion>> {
  return fromNullable(await findByPartitionKey(config, id, SortKey.GuidedDiscussion) as GuidedDiscussion);
}
export async function createGuidedDiscussion(config: IConfig, guidedDiscussion: GuidedDiscussion) {
  const document: Record<string, any> = { ...guidedDiscussion };
  document._pk = guidedDiscussion.id;
  document._sk = SortKey.GuidedDiscussion;
  document.attr2 = guidedDiscussion.guideId;
  document.attr3 = guidedDiscussion.explorerId;
  document.attr4 = guidedDiscussion.createdAt;
  document.attr2 = guidedDiscussion.status;

  await createDocument(config, document);
}
export async function findByGuideId(config: IConfig, guideId: string): Promise<GuidedDiscussion[]> {
  const items = await queryByAttr(config, 'attr2', guideId, SortKey.GuidedDiscussion, '#attr = :attrValue', 'attr2-index');

  const discussions: GuidedDiscussion[] = [];
  for (const item of items) {
    const fixedDiscussion = fromNullable(item as GuidedDiscussion);
    if (isSome(fixedDiscussion)) {
      discussions.push(fixedDiscussion.value);
    }
  }

  return discussions;
}
export async function findByStatusWithTimeRange(config: IConfig, status: string, startTime: number, endTime: number): Promise<GuidedDiscussion[]> {
  let filters: IFilterData = {
    expression: '#filterAttr BETWEEN :filterValue1 AND :filterValue2',
    names: { '#filterAttr': 'startTime' },
    values: { ':filterValue1': startTime, ':filterValue2': endTime }
  };
  const items = await queryByAttr(config, 'attr1', status, SortKey.GuidedDiscussion, '#attr = :attrValue', 'attr1-index', filters);

  const discussions: GuidedDiscussion[] = [];
  for (const item of items) {
    const fixedDiscussion = fromNullable(item as GuidedDiscussion);
    if (isSome(fixedDiscussion)) {
      discussions.push(fixedDiscussion.value);
    }
  }

  return discussions;
}
export async function findByExplorerId(config: IConfig, explorerId: string, status?: GuidedDiscussionStatus): Promise<GuidedDiscussion[]> {
  let filters: IFilterData | undefined;
  if (status != null) {
    filters = {
      expression: '#filterAttr = :filterValue',
      names: { '#filterAttr': 'attr1' },
      values: { ':filterValue': status }
    }
  }
  const items = await queryByAttr(config, 'attr3', explorerId, SortKey.GuidedDiscussion, '#attr = :attrValue', 'attr3-index', filters);

  const discussions: GuidedDiscussion[] = [];
  for (const item of items) {
    const fixedDiscussion = fromNullable(item as GuidedDiscussion);
    if (isSome(fixedDiscussion)) {
      discussions.push(fixedDiscussion.value);
    }
  }

  return discussions;
}
export async function updateGuidedDiscussion(config: IConfig, guidedDiscussion: GuidedDiscussion, fieldsToUpdate: string[]) {
  const document: Record<string, any> = { ...guidedDiscussion };
  document._pk = guidedDiscussion.id;
  document._sk = SortKey.GuidedDiscussion;
  if (guidedDiscussion.guideId != null) {
    document.attr2 = guidedDiscussion.guideId;
    fieldsToUpdate.push('attr2');
  }
  if (guidedDiscussion.status != null) {
    document.attr1 = guidedDiscussion.status;
    fieldsToUpdate.push('attr1');
  }

  await updateDocument(config, document, fieldsToUpdate);
}

export async function findAllForResponsReport(config: IConfig, startOfDate: number, endOfDate: number): Promise<GuidedDiscussion[]> {
  const items = await queryByAttrBetween({
    awsConfig: config,
    attrName: 'attr4',
    value1: startOfDate,
    value2: endOfDate,
    sortKeyValue: SortKey.GuidedDiscussion,
    expression: '#attr BETWEEN :attrValue1 AND :attrValue2',
    index: 'attr4-index',
  });
  const answers: GuidedDiscussion[] = [];

  for (const item of items) {
    answers.push(item as GuidedDiscussion);
  }

  return answers;
}
export async function removeFields(config: IConfig, id: string, fieldsToRemove: string[]) {
  await removeAttr(config, id, SortKey.GuidedDiscussion, fieldsToRemove.join(','));
}
