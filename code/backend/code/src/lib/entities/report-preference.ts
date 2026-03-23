import { createId } from '@paralleldrive/cuid2';
import { Entity, currentAt, currentOn } from '../entity';
import * as AWSReportPreference from '../aws/dynamodb/report-preference';
import config from '../../config';
import { SortType } from '../constants';
import { ReportType } from '../report/constants';

export type GetPreferencesData = {
  personId: string;
  reportType: ReportType;
}

/**
 * {@link Entity}
 * @property {string} reportType - report type(_attr1_)
 * @property {string} sortBy
 * @property {string} sortType
 * @property {string[]} columns 
 * @property {string} personId
 * @property {name} name
 */
export interface ReportPreference extends Entity {
  reportType: ReportType;
  sortBy: string;
  sortType: SortType;
  columns: string[];
  name: string;
  personId: string;
}
export async function createReportPreference(data: ReportPreference): Promise<ReportPreference> {
  data.id = data.id ?? createId();
  data.createdBy = data.personId;
  data.createdAt = currentAt();
  data.createdOn = currentOn();
  data.updatedBy = data.createdBy;
  data.updatedAt = data.createdAt;
  data.updatedOn = data.createdOn;

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSReportPreference.create(config.awsConfig!, data);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return data;
}
export async function findByReportPreferenceId(id: string): Promise<ReportPreference | undefined> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSReportPreference.findById(config.awsConfig!, id);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function updateReportPreference(preference: ReportPreference, pid: string): Promise<ReportPreference> {
  if (preference.id == null) throw Error('Report preference must have `id`.');

  preference.updatedBy = pid;
  preference.updatedAt = currentAt();
  preference.updatedOn = currentOn();

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSReportPreference.updateReportPreference(config.awsConfig!, preference);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return preference;
}
export async function deleteReportPreference(id: string): Promise<void> {
  switch (config.deploymenEnv) {
    case 'aws':
      await AWSReportPreference.deleteReportPreference(config.awsConfig!, id);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function findReportPreferenceByPersonId(data: GetPreferencesData): Promise<ReportPreference[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSReportPreference.findAllByPersonId(config.awsConfig!, data);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
