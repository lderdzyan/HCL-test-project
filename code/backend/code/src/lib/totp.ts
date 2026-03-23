import * as OTPAuth from 'otpauth';
import CryptoJS from 'crypto-js';

interface TotpOptions {
  period?: number;
  window?: number;
}
export function generateTotpCode(secret: string, options?: TotpOptions) {
  const period = options?.period ?? 30;
  const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromUTF8(secret), period, algorithm: 'SHA1' });
  return totp.generate();
}
export function verifyTotpCode(secret?: string, code?: string, options?: TotpOptions): boolean {
  if (secret == null || code == null) return false;

  const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromUTF8(secret), algorithm: 'SHA1' });
  const window = options?.window ?? 30;
  return totp.validate({ token: code, window }) != null;
}
export function encryptPassword(pwdSecret: string, password: string) {
  return CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, pwdSecret).update(password).finalize().toString();
}
