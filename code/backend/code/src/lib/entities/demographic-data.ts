import { createId } from '@paralleldrive/cuid2';
import { Entity, currentAt, currentOn } from '../entity';
import config from '../../config';
import * as AWSSurveyDemographicData from '../aws/dynamodb/demographic-data';

/**
 * {@link Entity}
 * @property {string} personId - person unique ID
 * @property {string} gender - person gender
 * @property {string} birthRegion - person birth region
 * @property {string} age - person age range
 * @property {string} industry - person industry
 * @property {string} education - person education
 * @property {string} occupation - person occupation
 * @property {string} liveRegion - person live region
 * @property {string} reported - momit report generated
 */
export interface SurveyDemographicData extends Entity {
  personId: string;
  gender?: string;
  birthRegion?: string;
  age?: string;
  industry?: string;
  education?: string;
  occupation?: string;
  liveRegion?: string;
  reported?: string;
}
export async function createDemographicData(data: SurveyDemographicData, pid: string): Promise<SurveyDemographicData> {
  data.id = data.id ?? createId();
  data.createdBy = pid;
  data.createdAt = currentAt();
  data.createdOn = currentOn();
  data.updatedBy = data.createdBy;
  data.updatedAt = data.createdAt;
  data.updatedOn = data.createdOn;
  data.reported = 'no';

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSSurveyDemographicData.create(config.awsConfig!, data);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return data;
}

export async function findDemographicDataByPid(pid: string): Promise<SurveyDemographicData | undefined> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSSurveyDemographicData.findByPersonId(config.awsConfig!, pid);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
