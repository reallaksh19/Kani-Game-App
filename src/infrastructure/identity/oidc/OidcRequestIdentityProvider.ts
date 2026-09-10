import {
  RequestIdentityError,
  type AuthenticatedRequestIdentity,
  type RequestIdentityProvider,
} from '../../../ports/identity.ts';

const SUPPORTED_ALGORITHM = 'RS256';
const MAX_JWKS_BYTES = 512 * 1024;
const MAX_JWKS_KEYS = 100;
const DEFAULT_CLOCK_SKEW_SECONDS = 60;
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_TTL_MS = 60 * 60 * 1000;

interface JwtHeader {
  alg?: unknown;
  typ?: unknown;
  kid?: unknown;
  [key: string]: unknown;
}

interface JwtClaims {
  iss?: unknown;
  aud?: unknown;
  sub?: unknown;
  exp?: unknown;
  nbf?: unknown;
  iat?: unknown;
  [key: string]: unknown;
}

interface SigningJwk extends JsonWebKey {
  kid?: string;
  alg?: string;
  use?: string;
  key_ops?: string[];
}

interface JwksCache {
  keysById: Map<string, SigningJwk>;
  expiresAtMs: number;
}

export interface OidcRequestIdentityProviderOptions {
  issuer: string;
  audience: string;
  jwksUrl: string;
  fetchImpl?: typeof fetch;
  now?: () => number;
  clockSkewSeconds?: number;
  defaultCacheTtlMs?: number;
}

function identityError(message: string, code: string, status = 401): RequestIdentityError {
  return new RequestIdentityError(message, { code, status });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isLoopback(hostname: string): boolean {
  const value = hostname.toLowerCase();
  return value === 'localhost' || value === '127.0.0.1' || value === '[::1]' || value === '::1';
}

function requireSecureUrl(value: string, label: string, options: { issuer?: boolean } = {}): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} is required.`);
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error(`${label} must be an absolute URL.`);
  }
  if (url.username || url.password) throw new Error(`${label} must not contain embedded credentials.`);
  if (url.hash) throw new Error(`${label} must not contain a fragment.`);
  if (options.issuer && url.search) throw new Error(`${label} must not contain a query string.`);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLoopback(url.hostname))) {
    throw new Error(`${label} must use HTTPS except for loopback test/development endpoints.`);
  }
  const normalized = url.toString();
  return options.issuer ? normalized.replace(/\/$/, '') : normalized;
}

function requireAudience(value: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error('OIDC audience is required.');
  if (normalized.length > 240) throw new Error('OIDC audience is too long.');
  return normalized;
}

function decodeBase64Url(value: string, label: string): Uint8Array {
  if (!value || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw identityError(`${label} is not valid base64url.`, 'JWT_MALFORMED');
  }
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    throw identityError(`${label} is not valid base64url.`, 'JWT_MALFORMED');
  }
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function parseJsonSegment<T extends Record<string, unknown>>(value: string, label: string): T {
  const bytes = decodeBase64Url(value, label);
  if (bytes.byteLength > 64 * 1024) throw identityError(`${label} is too large.`, 'JWT_MALFORMED');
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw identityError(`${label} is not valid JSON.`, 'JWT_MALFORMED');
  }
  if (!isObject(parsed)) throw identityError(`${label} must be a JSON object.`, 'JWT_MALFORMED');
  return parsed as T;
}

function requireNumericDate(value: unknown, name: string, required: boolean): number | null {
  if (value === undefined && !required) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw identityError(`JWT ${name} claim must be a numeric date.`, `JWT_${name.toUpperCase()}_INVALID`);
  }
  return value;
}

function cacheTtlFromHeaders(headers: Headers, fallbackMs: number): number {
  const cacheControl = headers.get('cache-control') || '';
  if (/\b(?:no-store|no-cache)\b/i.test(cacheControl)) return 0;
  const match = cacheControl.match(/(?:^|,)\s*max-age\s*=\s*(\d+)/i);
  if (!match) return fallbackMs;
  return Math.min(Number(match[1]) * 1000, MAX_CACHE_TTL_MS);
}

function assertSigningJwk(value: SigningJwk, kid: string): void {
  if (value.kid !== kid) throw identityError('JWKS key id does not match the requested signing key.', 'JWKS_KEY_INVALID', 503);
  if (value.kty !== 'RSA') throw identityError('JWKS signing key must be RSA for RS256.', 'JWKS_KEY_INVALID', 503);
  if (!value.n || !value.e) throw identityError('JWKS RSA signing key is incomplete.', 'JWKS_KEY_INVALID', 503);
  if (value.alg !== undefined && value.alg !== SUPPORTED_ALGORITHM) {
    throw identityError('JWKS signing key algorithm does not match RS256.', 'JWKS_KEY_INVALID', 503);
  }
  if (value.use !== undefined && value.use !== 'sig') {
    throw identityError('JWKS key is not marked for signatures.', 'JWKS_KEY_INVALID', 503);
  }
  if (value.key_ops !== undefined && !value.key_ops.includes('verify')) {
    throw identityError('JWKS key is not permitted for signature verification.', 'JWKS_KEY_INVALID', 503);
  }
}

/**
 * Provider-neutral OIDC/JWT request verifier.
 *
 * Authentication proves the request subject only. Household authorization is
 * deliberately resolved by KaniApiApp from Kani membership data after this
 * verifier succeeds.
 */
export class OidcRequestIdentityProvider implements RequestIdentityProvider {
  private readonly issuer: string;
  private readonly audience: string;
  private readonly jwksUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;
  private readonly clockSkewSeconds: number;
  private readonly defaultCacheTtlMs: number;
  private cache: JwksCache | null = null;
  private inFlightRefresh: Promise<JwksCache> | null = null;

  constructor(options: OidcRequestIdentityProviderOptions) {
    this.issuer = requireSecureUrl(options.issuer, 'OIDC issuer', { issuer: true });
    this.jwksUrl = requireSecureUrl(options.jwksUrl, 'OIDC JWKS URL');
    this.audience = requireAudience(options.audience);
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.now = options.now ?? Date.now;
    const skew = options.clockSkewSeconds ?? DEFAULT_CLOCK_SKEW_SECONDS;
    if (!Number.isFinite(skew) || skew < 0 || skew > 300) throw new Error('OIDC clock skew must be between 0 and 300 seconds.');
    this.clockSkewSeconds = skew;
    const ttl = options.defaultCacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
    if (!Number.isFinite(ttl) || ttl < 0 || ttl > MAX_CACHE_TTL_MS) throw new Error('OIDC JWKS cache TTL is invalid.');
    this.defaultCacheTtlMs = ttl;
  }

  async verifyRequest(request: Request): Promise<AuthenticatedRequestIdentity> {
    const authorization = request.headers.get('authorization');
    if (!authorization) throw identityError('Bearer authorization is required.', 'AUTHORIZATION_REQUIRED');
    const match = authorization.match(/^Bearer\s+([^\s,]+)$/i);
    if (!match) throw identityError('Authorization must contain exactly one Bearer token.', 'BEARER_TOKEN_INVALID');
    const token = match[1];
    const segments = token.split('.');
    if (segments.length !== 3 || segments.some((segment) => !segment)) {
      throw identityError('JWT must contain exactly three compact segments.', 'JWT_MALFORMED');
    }

    const header = parseJsonSegment<JwtHeader>(segments[0], 'JWT header');
    if (header.alg !== SUPPORTED_ALGORITHM) {
      throw identityError('JWT signing algorithm is not allowed.', 'JWT_ALGORITHM_UNSUPPORTED');
    }
    if (header.typ !== undefined && header.typ !== 'JWT' && header.typ !== 'at+jwt') {
      throw identityError('JWT typ header is not accepted.', 'JWT_TYPE_INVALID');
    }
    if (typeof header.kid !== 'string' || !header.kid.trim() || header.kid.length > 200) {
      throw identityError('JWT kid header is required.', 'JWT_KEY_ID_REQUIRED');
    }

    const key = await this.getVerificationKey(header.kid);
    const signingInput = new TextEncoder().encode(`${segments[0]}.${segments[1]}`);
    const signature = decodeBase64Url(segments[2], 'JWT signature');
    const signatureBuffer = signature.slice().buffer as ArrayBuffer;
    let verified = false;
    try {
      verified = await crypto.subtle.verify(
        { name: 'RSASSA-PKCS1-v1_5' },
        key,
        signatureBuffer,
        signingInput,
      );
    } catch {
      throw identityError('JWT signature verification could not be completed.', 'JWT_SIGNATURE_INVALID');
    }
    if (!verified) throw identityError('JWT signature is invalid.', 'JWT_SIGNATURE_INVALID');

    const claims = parseJsonSegment<JwtClaims>(segments[1], 'JWT payload');
    this.validateClaims(claims);
    return {
      userId: claims.sub as string,
      claims: Object.freeze({ ...claims }),
    };
  }

  private validateClaims(claims: JwtClaims): void {
    if (claims.iss !== this.issuer) throw identityError('JWT issuer does not match the configured issuer.', 'JWT_ISSUER_INVALID');

    const audiences = typeof claims.aud === 'string'
      ? [claims.aud]
      : Array.isArray(claims.aud) && claims.aud.every((value) => typeof value === 'string')
        ? claims.aud as string[]
        : [];
    if (!audiences.includes(this.audience)) {
      throw identityError('JWT audience does not include the Kani API audience.', 'JWT_AUDIENCE_INVALID');
    }

    if (typeof claims.sub !== 'string' || !claims.sub.trim() || claims.sub.length > 256) {
      throw identityError('JWT subject is missing or invalid.', 'JWT_SUBJECT_INVALID');
    }

    const exp = requireNumericDate(claims.exp, 'exp', true) as number;
    const nbf = requireNumericDate(claims.nbf, 'nbf', false);
    const iat = requireNumericDate(claims.iat, 'iat', false);
    const nowSeconds = this.now() / 1000;
    if (nowSeconds - this.clockSkewSeconds >= exp) throw identityError('JWT is expired.', 'JWT_EXPIRED');
    if (nbf !== null && nowSeconds + this.clockSkewSeconds < nbf) throw identityError('JWT is not valid yet.', 'JWT_NOT_YET_VALID');
    if (iat !== null && iat > nowSeconds + this.clockSkewSeconds) throw identityError('JWT issued-at claim is in the future.', 'JWT_IAT_INVALID');
  }

  private async getVerificationKey(kid: string): Promise<CryptoKey> {
    let jwks = await this.getJwks(false);
    let jwk = jwks.keysById.get(kid);
    if (!jwk) {
      jwks = await this.getJwks(true);
      jwk = jwks.keysById.get(kid);
    }
    if (!jwk) throw identityError('JWT signing key was not found in JWKS.', 'JWKS_KEY_NOT_FOUND');
    assertSigningJwk(jwk, kid);
    try {
      return await crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify'],
      );
    } catch {
      throw identityError('JWKS signing key could not be imported.', 'JWKS_KEY_INVALID', 503);
    }
  }

  private async getJwks(forceRefresh: boolean): Promise<JwksCache> {
    if (!forceRefresh && this.cache && this.cache.expiresAtMs > this.now()) return this.cache;
    if (this.inFlightRefresh) return this.inFlightRefresh;
    this.inFlightRefresh = this.fetchJwks();
    try {
      const next = await this.inFlightRefresh;
      this.cache = next;
      return next;
    } finally {
      this.inFlightRefresh = null;
    }
  }

  private async fetchJwks(): Promise<JwksCache> {
    let response: Response;
    try {
      response = await this.fetchImpl(this.jwksUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        redirect: 'error',
      });
    } catch {
      throw identityError('OIDC JWKS endpoint is unavailable.', 'IDENTITY_PROVIDER_UNAVAILABLE', 503);
    }
    if (!response.ok) throw identityError('OIDC JWKS endpoint returned an error.', 'IDENTITY_PROVIDER_UNAVAILABLE', 503);
    const raw = await response.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_JWKS_BYTES) {
      throw identityError('OIDC JWKS response is too large.', 'JWKS_INVALID', 503);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw identityError('OIDC JWKS response is not valid JSON.', 'JWKS_INVALID', 503);
    }
    if (!isObject(parsed) || !Array.isArray(parsed.keys) || parsed.keys.length === 0 || parsed.keys.length > MAX_JWKS_KEYS) {
      throw identityError('OIDC JWKS response must contain a bounded keys array.', 'JWKS_INVALID', 503);
    }
    const keysById = new Map<string, SigningJwk>();
    for (const candidate of parsed.keys) {
      if (!isObject(candidate) || typeof candidate.kid !== 'string' || !candidate.kid.trim()) continue;
      const jwk = candidate as SigningJwk;
      if (keysById.has(jwk.kid as string)) {
        throw identityError('OIDC JWKS contains duplicate key ids.', 'JWKS_INVALID', 503);
      }
      keysById.set(jwk.kid as string, jwk);
    }
    if (keysById.size === 0) throw identityError('OIDC JWKS contains no usable keyed signing keys.', 'JWKS_INVALID', 503);
    const ttl = cacheTtlFromHeaders(response.headers, this.defaultCacheTtlMs);
    return { keysById, expiresAtMs: this.now() + ttl };
  }
}
