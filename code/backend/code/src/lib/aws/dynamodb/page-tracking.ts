import { SortKey, createDocument } from '.';
import { getEpochAfterDays } from '../../utils/date-utils';
import { PageTracking } from '../../entities/page-tracking';
import { IConfig } from '../config';

/*
 * ddbTable (string) - infraops-dev-tracking-{env}
 * attr1 (string) - personId
 * attr3 (string) - createdBy
 * attr4 (number) - createdAt
 */
export async function create(config: IConfig, pageTracking: PageTracking) {
  const document: Record<string, any> = { ...pageTracking };
  document._pk = pageTracking.id;
  document._sk = SortKey.PageTracking;
  document.attr1 = pageTracking.personId;
  document.attr3 = pageTracking.createdBy;
  document.attr4 = pageTracking.createdAt;
  //Get the current timestamp and calculate given days in milliseconds to get the timestamp for given days later
  document.expireAt = getEpochAfterDays(config.pageTrackingTtl);

  await createDocument({ ...config, ddbTable: config.ddbTables.tracking }, document);
}
