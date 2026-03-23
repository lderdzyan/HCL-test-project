import { IConfig } from './config';
import * as AWSDemographicData from './dynamodb/demographic-data';

export async function addReportedValueToDemographicData(config: IConfig) {
  const items = await AWSDemographicData.findByCreatedDateMoreThan(config, 0);
  for (const item of items) {
    if (item.reported == null) {
      item.reported = 'no';
      await AWSDemographicData.updateReported(config, item);
    }
  }

}
