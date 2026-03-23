import { KMSClient, SignCommand } from '@aws-sdk/client-kms';
import { createId } from '@paralleldrive/cuid2';
import { UnsecuredJWT } from 'jose';
import config from '../config';
import { AssignmentTargetType } from './constants';
import { UserController } from './controllers/user';
import { Person, findPersonById } from './entities/person';
import { UserProfile } from './entities/user-profile';

/**
 * Generates a signed JWT for MSO clients using AWS KMS.
 *
 * @param userDetails Optional database user data to embed in the token payload.
 * @param person Optional person entity tied to the user; fetched if absent.
 * @param userAssignments Optional cached user assignment map; lazily loaded when missing.
 * @param pid Person identifier used for JWT `aud`/`sub` fields.
 * @returns A PS256-signed JWT string ready for cookie/header transport.
 */
export async function generateToken(
  userDetails?: UserProfile,
  person?: Person,
  userAssignments?: Record<AssignmentTargetType, string[]>,
  pid?: string,
) {
  const signingAlg = 'RSASSA_PSS_SHA_256';
  let userInfo = undefined;
  if (userDetails != null) {
    if (userAssignments == null) {
      userAssignments = await UserController.getUserAssignees(userDetails.id!);
    }
    if (person == null) {
      person = await findPersonById(userDetails.personId);
    }
    userInfo = await UserController.getMainInfo(userDetails, person, userAssignments);
  }

  const unsecuredJWT = new UnsecuredJWT({ mso: { u: userInfo } })
    .setIssuedAt()
    .setNotBefore('0s')
    .setJti(createId())
    .setAudience(pid || '')
    .setSubject(pid || '')
    .setExpirationTime((process.env.MS_TOKEN_TTL ?? '8760') + 'h');
  const header = { alg: 'PS256', typ: 'JWT' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify((unsecuredJWT as any)._payload)).toString('base64url');
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const kmsClient = new KMSClient({ region: config.awsConfig?.region });
  const res = await kmsClient.send(
    new SignCommand({
      KeyId: process.env.MS_KMS_KEY_ID,
      Message: Buffer.from(signingInput),
      SigningAlgorithm: signingAlg,
      MessageType: 'RAW',
    }),
  );

  return `${signingInput}.${Buffer.from(res.Signature!).toString('base64url')}`;
}
