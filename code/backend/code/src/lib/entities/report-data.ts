import { createId } from '@paralleldrive/cuid2';
import { Entity, currentAt, currentOn } from '../entity';
import config from '../../config';
import * as AWSReportData from '../aws/dynamodb/report-data';
import { ProgressStatus } from '../constants';
import { ReportType } from '../report/constants';

/**
 * {@link Entity}
 * @property {string} type - report type(_attr1_)
 * @property {string} result
 * @property {string} status
 * @property {string} filter - filter data in JSON string
 * @property {string} meesage
 * @property {name} name - (_attr2_)
 */
export interface ReportData extends Entity {
  type: ReportType;
  result?: string;
  status?: ProgressStatus;
  filter?: string;
  name?: string;
  message?: string;
  idsToProcess?: string[];
}
export async function createReportData(data: ReportData, pid: string): Promise<ReportData> {
  data.id = data.id ?? createId();
  data.createdBy = pid;
  data.createdAt = currentAt();
  data.createdOn = currentOn();
  data.updatedBy = data.createdBy;
  data.updatedAt = data.createdAt;
  data.updatedOn = data.createdOn;
  data.status = ProgressStatus.InProgress;

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSReportData.create(config.awsConfig!, data);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return data;
}
export async function updateReportData(data: ReportData, fieldsToUpdate: string[], pid?: string): Promise<ReportData> {
  if (data.id == null) throw Error('Report data must have `id`.');

  data.updatedBy = pid ?? data.createdBy;
  data.updatedOn = currentOn();
  data.updatedAt = currentAt();

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSReportData.update(config.awsConfig!, data, fieldsToUpdate);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return data;
}
export async function setReportResult(data: ReportData): Promise<ReportData> {
  return updateReportData(data, ['result', 'status', 'attr3']);
}
export async function findReportDataById(pid: string): Promise<ReportData | undefined> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSReportData.findById(config.awsConfig!, pid);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function findAllByTypeAndPersonId(
  type: ReportType,
  pid: string,
  nextEvalutionKey: Record<string, string>[] | undefined,
): Promise<ReportData[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSReportData.findAllByTypeAndPersonId(config.awsConfig!, pid, type, nextEvalutionKey);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function deleteReportDataById(id: string): Promise<void> {
  switch (config.deploymenEnv) {
    case 'aws':
      await AWSReportData.deleteReortData(config.awsConfig!, id);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
