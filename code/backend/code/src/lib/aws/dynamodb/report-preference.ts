import { IFilterData, SortKey, createDocument, deleteByPartitionKey, findByPartitionKey, queryByAttr, updateDocument } from '.';
import { GetPreferencesData, ReportPreference } from '../../entities/report-preference';
import { IConfig } from '../config';

/*
 * attr1 (string) - reportType
 * attr3 (string) - createdBy
 * attr4 (number) - createdAt
 */
export async function create(config: IConfig, data: ReportPreference) {
  const document: Record<string, any> = { ...data };
  document._pk = data.id;
  document._sk = SortKey.ReportPreference;
  document.attr1 = data.reportType;
  document.attr3 = data.createdBy;
  document.attr4 = data.createdAt;

  await createDocument(config, document);
}
export async function findById(config: IConfig, id: string): Promise<ReportPreference | undefined> {
  const data = await findByPartitionKey(config, id, SortKey.ReportPreference);

  if (data == null) return undefined;

  return data as ReportPreference;
}
export async function updateReportPreference(config: IConfig, preference: ReportPreference) {
  const document: Record<string, any> = { ...preference };

  const updateColumns: string[] = ['name'];
  if (document.sortBy != null) updateColumns.push('sortBy');
  if (document.sortType != null) updateColumns.push('sortType');
  if (document.columns != null) updateColumns.push('columns');

  await updateDocument(config, document, updateColumns);
}
export async function deleteReportPreference(config: IConfig, id: string) {
  await deleteByPartitionKey(config, id, SortKey.ReportPreference);
}
export async function findAllByPersonId(config: IConfig, data: GetPreferencesData): Promise<ReportPreference[]> {
  const filters: IFilterData = {
    expression: '#filterAttr = :filterValue',
    names: { '#filterAttr': 'attr1' },
    values: { ':filterValue': data.reportType }
  }
  const items = await queryByAttr(
    config,
    'attr3',
    data.personId,
    SortKey.ReportPreference,
    '#attr = :attrValue',
    'attr3-index',
    filters
  );
  const answers: ReportPreference[] = [];

  for (const item of items) {
    if (item != null) {
      answers.push(item as ReportPreference);
    }
  }

  return answers;
}
