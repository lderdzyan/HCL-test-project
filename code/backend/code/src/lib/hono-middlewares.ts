import { createMiddleware } from 'hono/factory';
import config from '../config';
import { JWTPayload } from 'hono/utils/jwt/types';
import { createId } from '@paralleldrive/cuid2';
import { AssignmentTargetType, UserType } from './constants';
import { Context } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { decodeJwt } from 'jose';
import { generateToken } from './token';
import { UserProfile } from './entities/user-profile';
import { Person } from './entities/person';

type JWTEncryptedData = { iv: string; data: string };

export const msRequest = createMiddleware(async (c, next) => {
  const requestMsData = await c.req.json();
  c.set('pid', requestMsData.aud);
  await next();
});
export const msResponse = createMiddleware(async (c, next) => {
  await next();
  const obj = await c.res.json();
  const pid = c.get('pid');

  if (c.res.status >= 400) {
    c.res = c.json(obj, c.res);
  } else {
    const requestMsData = await c.req.json();
    const msToken = generateMSToken(pid ?? requestMsData.aud);

    c.res = c.json({ ...msToken, mso: obj }, c.res);
  }
});

export const encryptResponse = createMiddleware(async (c, next) => {
  await next();
  const obj = await c.res.json();
  const encryptedObj = await encryptJson(config.jwtSecret!, obj);

  const requestMsData = c.get('jwtPayload');
  const msToken = generateMSToken(requestMsData.aud);
  const encryptedMsToken = await encryptJson(config.jwtSecret!, msToken);
  c.res.headers.set('x-ms-token', JSON.stringify(encryptedMsToken));

  c.res = c.json(encryptedObj, c.res);
});

export const authRoute = (c: Context, allowedUserTypes: UserType[]) => {
  const accessToken = getCookie(c, 'accessToken');
  if (accessToken != null) {
    const payload = decodeJwt(accessToken) as { mso: { u: { userTypes: UserType[] } } };
    if (payload.mso?.u?.userTypes == null) {
      return false;
    } else {
      if (!payload.mso.u.userTypes.some((type) => allowedUserTypes?.includes(type))) {
        return false;
      }
    }
  }
  return true;
};

export const jwtMiddleware = createMiddleware<{
  Variables: { jwtPayload: JWTPayload; body?: any };
}>(async (c, next) => {
  try {
    const xMsToken = c.req.header('x-ms-token');
    if (xMsToken == null) {
      throw new Error();
    } else {
      const jwtData = JSON.parse(xMsToken) as JWTEncryptedData;
      const msData = await decryptJson(jwtData, config.jwtSecret!);

      if (isValidMsData(msData)) {
        c.set('jwtPayload', msData);
      } else {
        throw new Error('Invalid MS Data');
      }
    }
  } catch (e) {
    c.res = c.newResponse(null, 401);
    return;
  }

  // Decrypt request body if exists.
  try {
    const bodyJson = await c.req.json();
    c.set('body', await decryptJson(bodyJson as JWTEncryptedData, config.jwtSecret!));
  } catch (e) {}

  await next();
});

// TODO: Need to implement
const isValidMsData = (msData: any): boolean => {
  console.log(msData);
  return true;
};

const decryptJson = async (encryptedData: JWTEncryptedData, key: string) => {
  const decoder = new TextDecoder();
  const iv = Uint8Array.from(atob(encryptedData.iv), (c) => c.charCodeAt(0));
  const encrypted = Uint8Array.from(atob(encryptedData.data), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'AES-CBC' }, false, [
    'decrypt',
  ]);

  const decrypted = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, cryptoKey, encrypted);

  return JSON.parse(decoder.decode(decrypted));
};

const encryptJson = async (key: string, jsonData?: any): Promise<JWTEncryptedData | null> => {
  if (jsonData == null) return null;

  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(16));

  const cryptoKey = await crypto.subtle.importKey('raw', encoder.encode(key), { name: 'AES-CBC' }, false, ['encrypt']);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    cryptoKey,
    encoder.encode(JSON.stringify(jsonData)),
  );

  return {
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
  };
};

const generateMSToken = (pid: string) => {
  const now = Date.now();
  return {
    aud: pid,
    jti: createId(),
    exp: now + 10 * 60 * 1000,
    nbf: now,
    iat: now,
    aut: false,
    sub: pid,
  };
};

export async function setAccessTokenCookie(
  c: Context,
  userDetails?: UserProfile,
  person?: Person,
  userAssignments?: Record<AssignmentTargetType, string[]>,
  pid?: string,
) {
  const accessToken = await generateToken(userDetails, person, userAssignments, pid);
  const maxAge = parseInt(process.env.MS_TOKEN_TTL ?? '8760') * 60 * 60;
  setCookie(c, 'accessToken', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    path: '/',
    maxAge,
  });
}

export async function setExpiredAccessTokenCookie(c: Context) {
  setCookie(c, 'accessToken', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    path: '/',
    maxAge: 0,
  });
}
