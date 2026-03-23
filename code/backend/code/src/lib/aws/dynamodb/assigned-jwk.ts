import { SortKey, createDocument } from '.';
import { AssignedJWKDetails } from '../../entities/assigned-jwk';
import { IConfig } from '../config';

/**
 * attr1 (string) - objectId
 * attr3 (string) - createdBy
 * attr4 (number) - createdAt
 */
export async function assign(config: IConfig, assignedJwk: AssignedJWKDetails) {
  const document: Record<string, any> = { ...assignedJwk };
  document._pk = assignedJwk.id;
  document._sk = SortKey.AssignedJWKDetails;
  document.attr1 = assignedJwk.objectId;
  document.attr3 = assignedJwk.createdBy;
  document.attr4 = assignedJwk.createdAt;

  await createDocument(config, document);
}
