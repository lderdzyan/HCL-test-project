import { IFilterData, SortKey, createDocument, deleteByPartitionKey, findByPartitionKey, queryByAttr, updateDocument } from '.';
import { ReportData } from '../../entities/report-data';
import { ReportType } from '../../report/constants';
import { IConfig } from '../config';

/*
 * attr1 (string) - type
 * attr2 (string) - name
 * attr3 (string) - createdBy
 * attr4 (number) - createdAt
 */
export async function findById(config: IConfig, id: string): Promise<ReportData | undefined> {
  return _fixAttributes(await findByPartitionKey(config, id, SortKey.ReportData));
}
export async function create(config: IConfig, data: ReportData) {
  const document: Record<string, any> = { ...data };
  document._pk = data.id;
  document._sk = SortKey.ReportData;
  document.attr1 = data.type;
  document.attr3 = data.createdBy;
  document.attr4 = data.createdAt;

  await createDocument(config, document);
}
export async function update(config: IConfig, reportData: ReportData, fieldsToUpdate: string[]) {
  const document: Record<string, any> = { ...reportData };
  document._pk = reportData.id;
  document._sk = SortKey.ReportData;

  await updateDocument(config, document, fieldsToUpdate);
}
export async function deleteReortData(config: IConfig, id: string) {
  await deleteByPartitionKey(config, id, SortKey.ReportData);
}
export async function findAllByTypeAndPersonId(config: IConfig, pid: string, type: ReportType, nextEvalutionKey: Record<string, string>[] | undefined) {
  //TODO need to implement pagination
  const filters: IFilterData = {
    expression: '#filterAttr = :filterValue',
    names: { '#filterAttr': 'attr1' },
    values: { ':filterValue': type }
  }
  const items = await queryByAttr(
    config,
    'attr3',
    pid,
    SortKey.ReportData,
    '#attr = :attrValue',
    'attr3-index',
    filters
  );
  const reports: ReportData[] = [];

  for (const item of items) {
    const report = _fixAttributes(item);
    if (report != null) {
      report.result = undefined;
      reports.push(report);
    }
  }

  return reports;
}
function _fixAttributes(item?: Record<string, any>): ReportData | undefined {
  if (item == null) return undefined;

  const data = item as ReportData;

  if (data.id == null) data.id = item._pk;
  if (data.type == null) data.type = item.attr1;
  if (data.createdBy == null) data.createdBy = item.attr3;
  if (data.createdAt == null) data.createdAt = item.attr4;

  return data;
}
