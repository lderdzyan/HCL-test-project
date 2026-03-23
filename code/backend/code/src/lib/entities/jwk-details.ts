import { createId } from '@paralleldrive/cuid2';
import { Entity, currentAt, currentOn } from '../entity';
import config from '../../config';
import * as AWSJWKDetails from '../aws/dynamodb/jwk-details';

/**
 * {@link Entity}
 * @property {string} kty
 * @property {string} x
 * @property {string} y
 * @property {string} crv
 * @property {string} use
 * @property {string} alg
 * @property {string} x5t
 * @property {string} d
 */
export interface JWKDetails extends Entity {
  kty: string;
  x: string;
  y: string;
  crv: string;
  use: string;
  alg: string;
  x5t: string;
  d: string;
}
export async function createJWK(jwk: JWKDetails, pid: string): Promise<JWKDetails> {
  jwk.id = jwk.id ?? createId();
  jwk.createdBy = pid;
  jwk.createdAt = currentAt();
  jwk.createdOn = currentOn();
  jwk.updatedBy = jwk.createdBy;
  jwk.updatedAt = jwk.createdAt;
  jwk.updatedOn = jwk.createdOn;

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSJWKDetails.create(config.awsConfig!, jwk);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return jwk;
}
