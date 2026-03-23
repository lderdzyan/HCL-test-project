import { SurveyDemographicData } from '../../entities/demographic-data';
import { Logger } from '../../logger';
import { IConfig } from '../config';
import { SortKey, removeAttr } from '../dynamodb';
import { findByCreatedDateMoreThan } from '../dynamodb/demographic-data';

// Load all demographic data, remove pid attribute from items.
export async function removePidDemographicData(config: IConfig) {
  const demographicData = await findByCreatedDateMoreThan(config, 0);

  Logger.info(`Found ${demographicData.length} items to update.`);
  for (const data of demographicData) {
    const item: SurveyDemographicData = data as SurveyDemographicData;
    if (item.id != null) {
      await removeAttr(config, item.id, SortKey.DemographicData, 'pid');
    }
  }
  Logger.info('Done demographicData updated.');
}
