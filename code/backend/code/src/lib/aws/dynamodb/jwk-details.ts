import { SortKey, createDocument } from '.';
import { JWKDetails } from '../../entities/jwk-details';
import { IConfig } from '../config';

/*
 * attr3 (string) - createdBy
 * attr4 (number) - createdAt
 */
export async function create(config: IConfig, jwkDetails: JWKDetails) {
  const document: Record<string, any> = { ...jwkDetails };
  document._pk = jwkDetails.id;
  document._sk = SortKey.JWKDetails + '_' + Date.now();
  document.attr3 = jwkDetails.createdBy;
  document.attr4 = jwkDetails.createdAt;

  await createDocument(config, document);
}
