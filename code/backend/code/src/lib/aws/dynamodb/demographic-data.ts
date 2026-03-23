import { SortKey, createDocument, findByPartitionKey, queryByAttr, queryByAttrBetween, updateDocument } from '.';
import { SurveyDemographicData } from '../../entities/demographic-data';
import { IConfig } from '../config';

/*
 * attr1 (string) - personId
 * attr2 (string) - reported
 * attr3 (string) - createdBy
 * attr4 (number) - createdAt
 */
export async function findById(config: IConfig, id: string): Promise<SurveyDemographicData | undefined> {
  return _fixAttributes(await findByPartitionKey(config, id, SortKey.DemographicData));
}

export async function create(config: IConfig, data: SurveyDemographicData) {
  const document: Record<string, any> = { ...data };
  document._pk = data.id;
  document._sk = SortKey.DemographicData;
  document.attr1 = data.personId;
  document.attr2 = 'no';
  document.attr3 = data.createdBy;
  document.attr4 = data.createdAt;

  await createDocument(config, document);
}
export async function findByPersonId(config: IConfig, personId: string): Promise<SurveyDemographicData | undefined> {
  const data = await queryByAttr(
    config,
    'attr1',
    personId,
    SortKey.DemographicData,
    '#attr = :attrValue',
    'attr1-index',
  );

  if (data == null || data.length === 0) return undefined;
  const demographicDataList: SurveyDemographicData[] = [];
  for (const item of data) {
    const demographicData = _fixAttributes(item);
    if (demographicData != null) {
      demographicDataList.push(demographicData);
    }
  }

  demographicDataList.sort((item1: SurveyDemographicData, item2: SurveyDemographicData) => (item1.createdAt! > item2.createdAt! ? -1 : 0));

  return demographicDataList[0];
}
export async function findByCreatedDateMoreThan(config: IConfig, createdDate: number): Promise<SurveyDemographicData[]> {
  const items = await queryByAttr(
    config,
    'attr4',
    createdDate,
    SortKey.DemographicData,
    '#attr > :attrValue',
    'attr4-index',
  );

  const demographicDataList: SurveyDemographicData[] = [];
  for (const item of items) {
    const demographicData = _fixAttributes(item);
    if (demographicData != null) {
      demographicDataList.push(demographicData);
    }
  }
  return demographicDataList;
}
export async function findAllForReport(config: IConfig, startOfDate: number, endOfDate: number): Promise<SurveyDemographicData[]> {
  const items = await queryByAttrBetween({
    awsConfig: config,
    attrName: 'attr4',
    value1: startOfDate,
    value2: endOfDate,
    sortKeyValue: SortKey.DemographicData,
    expression: '#attr BETWEEN :attrValue1 AND :attrValue2',
    index: 'attr4-index',
  });

  const demographicDataList: SurveyDemographicData[] = [];
  for (const item of items) {
    const demographicData = _fixAttributes(item);
    if (demographicData != null) {
      demographicDataList.push(demographicData);
    }
  }

  return demographicDataList;
}
export async function updateReported(config: IConfig, data: SurveyDemographicData) {
  const document: Record<string, any> = { ...data };
  document._pk = data.id;
  document._sk = SortKey.DemographicData;
  document.attr2 = data.reported;

  await updateDocument(config, document, ['attr2', 'reported']);
}
function _fixAttributes(item?: Record<string, any>): SurveyDemographicData | undefined {
  if (item == null) return undefined;

  const data = item as SurveyDemographicData;

  if (data.id == null) data.id = item._pk;
  if (data.personId == null) data.personId = item.attr1;
  if (data.createdBy == null) data.createdBy = item.attr3;
  if (data.createdAt == null) data.createdAt = item.attr4;
  if (data.reported == null) data.reported = item.attr2;

  return data;
}
