import * as Boom from '@hapi/boom';
import { createId, isCuid } from '@paralleldrive/cuid2';
import Joi from 'joi';
import { decodeJwt } from 'jose';
import { UserType } from './constants';
import { BadRequestError } from './errors';

export interface IRequestPayload<T extends IMsoData> {
  aud: string;
  jti: string;
  exp: number;
  nbf: number;
  iat: number;
  aut: boolean;
  sub: string;
  mso: T;
}
export interface IMsoData {
  mdtl: number;
  hdtl: number;
}
export const msoDataSchema = Joi.object<IMsoData>({
  mdtl: Joi.number().required(),
  hdtl: Joi.number().required(),
});
export function cuid(value: string, halper: Joi.CustomHelpers<string>) {
  if (isCuid(value)) {
    return value;
  }

  return halper.error('any.invalid');
}
interface IResponseOptions {
  pid: string;
  auth?: boolean;
}
export function respond(data: Record<string, any>, options: IResponseOptions): IRequestPayload<IMsoData> {
  const now = Date.now();
  return {
    aud: options.pid,
    jti: createId(),
    exp: now + 10 * 60 * 1000,
    nbf: now,
    iat: now,
    aut: options.auth ?? false,
    sub: options.pid,
    mso: {
      ...data,
      mdtl: 1,
      hdtl: 1,
    },
  };
}

export async function verifyValidateRequest<T extends IMsoData>(
  requestData: any,
  schema?: Joi.ObjectSchema<T>,
  authRoute?: { accessToken?: string; allowedUserTypes?: UserType[] },
): Promise<IRequestPayload<T>> {
  if (authRoute != null && authRoute.accessToken != null && authRoute.allowedUserTypes != null) {
    const payload = decodeJwt(authRoute.accessToken) as { mso: { u: { userTypes: UserType[] } } };
    if (payload.mso?.u?.userTypes == null) {
      throw Boom.forbidden();
    } else {
      if (!payload.mso.u.userTypes.some((type) => authRoute.allowedUserTypes?.includes(type))) {
        throw Boom.forbidden();
      }
    }
  }
  return validate(verify(requestData), schema);
}

/**
 * Verifies and returns request JWT.
 *
 * @returns IRequestPayload<T> if request JWT and inner data are not expired.
 */
function verify<T extends IMsoData>(requestData: any): IRequestPayload<T> {
  const nbfTimeGap: number = 6 * 60 * 100; // 6 minutes
  if (
    requestData.jti == null ||
    requestData.jti.trim() === '' ||
    requestData.exp == null ||
    requestData.nbf == null ||
    requestData.iat == null ||
    requestData.sub == null ||
    requestData.sub.trim() === ''
  ) {
    throw new BadRequestError('Wrong data.');
  }

  const currentEpoch = Date.now();

  let iatDate: number | undefined;
  try {
    iatDate = parseInt(requestData.iat);
  } catch (e) {
    throw new BadRequestError('Wrong iat.');
  }

  let nbfDate: number | undefined;
  let nbfDatePlus: number | undefined;
  let nbfDateMinus: number | undefined;
  try {
    nbfDate = parseInt(requestData.nbf);
    nbfDatePlus = nbfDate + nbfTimeGap;
    nbfDateMinus = nbfDate - nbfTimeGap;
  } catch (e) {
    throw new BadRequestError('Wrong nbf.');
  }

  let expDate: number | undefined;
  try {
    expDate = parseInt(requestData.exp);
  } catch (e) {
    throw new BadRequestError('Wrong exp.');
  }

  if (iatDate > nbfDate || iatDate >= expDate || nbfDate >= expDate || currentEpoch >= expDate) {
    throw new BadRequestError('Invalid request.');
  }

  return requestData as IRequestPayload<T>;
}

/**
 * Validates and returns request data.
 *
 * @returns IRequestPayload<T> if request data is valid.
 */
async function validate<T extends IMsoData>(
  requestData: any,
  schema?: Joi.ObjectSchema<T>,
): Promise<IRequestPayload<T>> {
  const data = requestData as IRequestPayload<T>;
  const requestPayloadSchema = Joi.object<IRequestPayload<T>>({
    aud: Joi.string().custom(cuid).required(),
    jti: Joi.string().required(),
    exp: Joi.number().required(),
    nbf: Joi.number().required(),
    iat: Joi.number().required(),
    aut: Joi.boolean().required(),
    sub: Joi.string().custom(cuid).required(),
    mso: schema ?? msoDataSchema,
  });
  try {
    return await requestPayloadSchema.validateAsync(data);
  } catch (e) {
    throw e;
  }
}
