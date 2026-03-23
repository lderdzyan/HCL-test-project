import { createId } from '@paralleldrive/cuid2';
import { currentAt, currentOn, Entity } from '../entity';
import config from '../../config';
import * as AWSTaxamoResponse from '../aws/dynamodb/taxamo-response';

/**
 * {@link Entity}
 * @property {string} stripeId
 * @property {string} taxamoTransactionId
 * @property {string} personId
 */

export interface TaxamoResponse extends Entity {
  stripeId: string,
  taxamoTransactionId: string;
  personId: string;
  [key: string]: string | number | string[] | number[] | undefined;
}

export async function createTaxamoResponse(taxamoResponse: TaxamoResponse): Promise<TaxamoResponse> {
  taxamoResponse.id = taxamoResponse.id ?? createId();
  taxamoResponse.createdAt = currentAt();
  taxamoResponse.createdOn = currentOn();
  taxamoResponse.createdBy = taxamoResponse.personId;
  taxamoResponse.updatedAt = taxamoResponse.createdAt;
  taxamoResponse.updatedOn = taxamoResponse.createdOn;
  taxamoResponse.updatedBy = taxamoResponse.personId;

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSTaxamoResponse.createTaxamoResponse(config.awsConfig!, taxamoResponse);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return taxamoResponse;
}
