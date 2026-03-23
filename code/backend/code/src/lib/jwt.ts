import * as jose from 'jose';
import * as TE from 'fp-ts/TaskEither';
import * as F from 'fp-ts/function';
import { JWKDetails } from './entities/jwk-details';

class JWKGenerationError extends Error {
  public readonly error: Error;
  constructor(message: string, error: unknown) {
    super(message);
    this.error = error as Error;
    this.message = `${this.message} ${this.error.message}`;
  }
}

type JWKOptions = {
  kid: string;
  use?: string;
};
export function generateJWK(
  options: JWKOptions,
  alg: string = 'ES256',
  crv: string = 'P-256',
): TE.TaskEither<JWKGenerationError, jose.JWK> {
  return F.pipe(
    TE.tryCatch(
      async () => jose.generateKeyPair(alg, { crv }),
      (error) => new JWKGenerationError('Key pair generation fail.', error),
    ),
    TE.flatMap((jwks) =>
      F.pipe(
        TE.tryCatch(
          async () => jose.exportJWK(jwks.privateKey),
          (error) => new JWKGenerationError('Private key export fail.', error),
        ),
        TE.flatMap((privateJwk) => {
          privateJwk.kid = options.kid;
          privateJwk.use = options.use ?? 'sig';

          return F.pipe(
            TE.tryCatch(
              async () => jose.calculateJwkThumbprint(privateJwk, 'sha256'),
              (error) => new JWKGenerationError('Thumbprint calculation fail.', error),
            ),
            TE.flatMap((jwkThumbprint) => {
              privateJwk.x5t = jwkThumbprint;
              return TE.right(privateJwk);
            }),
          );
        }),
      ),
    ),
  );
}
export function convertJWKtoJWKDetails(jwk: jose.JWK): JWKDetails {
  return {
    id: jwk.kid!,
    alg: jwk.alg!,
    kty: jwk.kty!,
    crv: jwk.crv!,
    x: jwk.x!,
    y: jwk.y!,
    d: jwk.d!,
    use: jwk.use!,
    x5t: jwk.x5t!,
  };
}
