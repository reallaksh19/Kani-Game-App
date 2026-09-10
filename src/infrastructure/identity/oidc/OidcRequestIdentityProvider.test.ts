// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { OidcRequestIdentityProvider } from './OidcRequestIdentityProvider.ts';

const NOW_MS = 1_800_000_000_000;
const ISSUER = 'https://issuer.example.test';
const AUDIENCE = 'kani-api';
const encoder = new TextEncoder();

interface SigningFixture {
  kid: string;
  privateKey: CryptoKey;
  jwk: JsonWebKey & { kid: string; alg: string; use: string };
}

function base64Url(value: string | Uint8Array): string {
  const bytes = typeof value === 'string' ? encoder.encode(value) : value;
  return Buffer.from(bytes).toString('base64url');
}

async function createSigningFixture(kid: string): Promise<SigningFixture> {
  const pair = await crypto.subtle.generateKey({
    name: 'RSASSA-PKCS1-v1_5',
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256',
  }, true, ['sign', 'verify']) as CryptoKeyPair;
  const exported = await crypto.subtle.exportKey('jwk', pair.publicKey);
  return {
    kid,
    privateKey: pair.privateKey,
    jwk: { ...exported, kid, alg: 'RS256', use: 'sig' },
  };
}

async function signJwt(
  fixture: SigningFixture,
  claims: Record<string, unknown> = {},
  headerOverrides: Record<string, unknown> = {},
): Promise<string> {
  const now = Math.floor(NOW_MS / 1000);
  const header = { alg: 'RS256', typ: 'JWT', kid: fixture.kid, ...headerOverrides };
  const payload = {
    iss: ISSUER,
    aud: AUDIENCE,
    sub: 'guardian-a',
    iat: now - 5,
    exp: now + 600,
    ...claims,
  };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = new Uint8Array(await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    fixture.privateKey,
    encoder.encode(signingInput),
  ));
  return `${signingInput}.${base64Url(signature)}`;
}

function bearerRequest(token?: string): Request {
  return new Request('https://api.example.test/api/v1/students', {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

let keyA: SigningFixture;
let keyB: SigningFixture;
let currentKeys: Array<JsonWebKey & { kid: string }>;
let fetchCount = 0;

beforeAll(async () => {
  [keyA, keyB] = await Promise.all([createSigningFixture('key-a'), createSigningFixture('key-b')]);
});

beforeEach(() => {
  currentKeys = [keyA.jwk];
  fetchCount = 0;
});

function provider(fetchOverride?: typeof fetch): OidcRequestIdentityProvider {
  const fetchImpl = fetchOverride ?? (async () => {
    fetchCount += 1;
    return new Response(JSON.stringify({ keys: currentKeys }), {
      status: 200,
      headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=300' },
    });
  }) as typeof fetch;
  return new OidcRequestIdentityProvider({
    issuer: ISSUER,
    audience: AUDIENCE,
    jwksUrl: `${ISSUER}/.well-known/jwks.json`,
    fetchImpl,
    now: () => NOW_MS,
    clockSkewSeconds: 30,
  });
}

describe('OidcRequestIdentityProvider', () => {
  it('verifies RS256 signature, issuer, audience and subject', async () => {
    const identity = await provider().verifyRequest(bearerRequest(await signJwt(keyA, { aud: ['other-api', AUDIENCE] })));
    expect(identity.userId).toBe('guardian-a');
    expect(identity.claims).toMatchObject({ iss: ISSUER, sub: 'guardian-a' });
    expect(fetchCount).toBe(1);
  });

  it('requires exactly one bearer token and a three-segment JWT', async () => {
    const verifier = provider();
    await expect(verifier.verifyRequest(bearerRequest())).rejects.toMatchObject({ code: 'AUTHORIZATION_REQUIRED', status: 401 });
    await expect(verifier.verifyRequest(new Request('https://api.example.test', { headers: { authorization: 'Basic abc' } })))
      .rejects.toMatchObject({ code: 'BEARER_TOKEN_INVALID', status: 401 });
    await expect(verifier.verifyRequest(bearerRequest('abc.def'))).rejects.toMatchObject({ code: 'JWT_MALFORMED', status: 401 });
  });

  it('rejects algorithm confusion and invalid typ/kid headers before accepting claims', async () => {
    await expect(provider().verifyRequest(bearerRequest(await signJwt(keyA, {}, { alg: 'HS256' }))))
      .rejects.toMatchObject({ code: 'JWT_ALGORITHM_UNSUPPORTED' });
    await expect(provider().verifyRequest(bearerRequest(await signJwt(keyA, {}, { typ: 'JWE' }))))
      .rejects.toMatchObject({ code: 'JWT_TYPE_INVALID' });
    await expect(provider().verifyRequest(bearerRequest(await signJwt(keyA, {}, { kid: '' }))))
      .rejects.toMatchObject({ code: 'JWT_KEY_ID_REQUIRED' });
  });

  it('rejects wrong issuer, audience, missing subject and temporal claim failures', async () => {
    const verifier = provider();
    const now = Math.floor(NOW_MS / 1000);
    await expect(verifier.verifyRequest(bearerRequest(await signJwt(keyA, { iss: 'https://attacker.example.test' }))))
      .rejects.toMatchObject({ code: 'JWT_ISSUER_INVALID' });
    await expect(verifier.verifyRequest(bearerRequest(await signJwt(keyA, { aud: 'different-api' }))))
      .rejects.toMatchObject({ code: 'JWT_AUDIENCE_INVALID' });
    await expect(verifier.verifyRequest(bearerRequest(await signJwt(keyA, { sub: '' }))))
      .rejects.toMatchObject({ code: 'JWT_SUBJECT_INVALID' });
    await expect(verifier.verifyRequest(bearerRequest(await signJwt(keyA, { exp: now - 31 }))))
      .rejects.toMatchObject({ code: 'JWT_EXPIRED' });
    await expect(verifier.verifyRequest(bearerRequest(await signJwt(keyA, { nbf: now + 31 }))))
      .rejects.toMatchObject({ code: 'JWT_NOT_YET_VALID' });
    await expect(verifier.verifyRequest(bearerRequest(await signJwt(keyA, { iat: now + 31 }))))
      .rejects.toMatchObject({ code: 'JWT_IAT_INVALID' });
  });

  it('rejects an invalid signature and an unknown signing key', async () => {
    const wrongSignature = await signJwt(keyB, {}, { kid: keyA.kid });
    await expect(provider().verifyRequest(bearerRequest(wrongSignature)))
      .rejects.toMatchObject({ code: 'JWT_SIGNATURE_INVALID', status: 401 });

    // Isolate the unknown-key verifier so this assertion proves its own
    // initial JWKS fetch plus exactly one forced refresh on kid miss.
    fetchCount = 0;
    await expect(provider().verifyRequest(bearerRequest(await signJwt(keyB))))
      .rejects.toMatchObject({ code: 'JWKS_KEY_NOT_FOUND', status: 401 });
    expect(fetchCount).toBe(2);
  });

  it('uses a bounded JWKS cache and refreshes once on key rotation', async () => {
    const verifier = provider();
    await verifier.verifyRequest(bearerRequest(await signJwt(keyA)));
    await verifier.verifyRequest(bearerRequest(await signJwt(keyA, { sub: 'guardian-a-2' })));
    expect(fetchCount).toBe(1);

    currentKeys = [keyA.jwk, keyB.jwk];
    const rotated = await verifier.verifyRequest(bearerRequest(await signJwt(keyB, { sub: 'guardian-b' })));
    expect(rotated.userId).toBe('guardian-b');
    expect(fetchCount).toBe(2);
  });

  it('fails closed on malformed or ambiguous JWKS documents', async () => {
    const duplicateKidFetch = (async () => new Response(JSON.stringify({ keys: [keyA.jwk, { ...keyB.jwk, kid: keyA.kid }] }), { status: 200 })) as typeof fetch;
    await expect(provider(duplicateKidFetch).verifyRequest(bearerRequest(await signJwt(keyA))))
      .rejects.toMatchObject({ code: 'JWKS_INVALID', status: 503 });

    const unavailable = (async () => new Response('down', { status: 503 })) as typeof fetch;
    await expect(provider(unavailable).verifyRequest(bearerRequest(await signJwt(keyA))))
      .rejects.toMatchObject({ code: 'IDENTITY_PROVIDER_UNAVAILABLE', status: 503 });
  });

  it('rejects insecure remote issuer/JWKS configuration while permitting loopback HTTP', () => {
    expect(() => new OidcRequestIdentityProvider({
      issuer: 'http://issuer.example.test', audience: AUDIENCE, jwksUrl: 'https://issuer.example.test/jwks',
    })).toThrow(/HTTPS/);
    expect(() => new OidcRequestIdentityProvider({
      issuer: 'https://issuer.example.test', audience: AUDIENCE, jwksUrl: 'http://issuer.example.test/jwks',
    })).toThrow(/HTTPS/);
    expect(() => new OidcRequestIdentityProvider({
      issuer: 'http://127.0.0.1:9000/issuer', audience: AUDIENCE, jwksUrl: 'http://127.0.0.1:9000/jwks',
    })).not.toThrow();
  });
});
