// @vitest-environment node
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { KaniApiApp } from '../../application/api/KaniApiApp.ts';
import type { KaniAttemptV1 } from '../../domain/contracts.ts';
import { createKaniNodeServer } from '../http/node/createKaniNodeServer.ts';
import { OidcRequestIdentityProvider } from '../identity/oidc/OidcRequestIdentityProvider.ts';
import { SQLiteStore } from '../storage/sqlite/SQLiteStore.ts';

const NOW_MS = 1_800_000_000_000;
const ALLOWED_ORIGIN = 'https://reallaksh19.github.io';
const AUDIENCE = 'kani-api';
const HOUSEHOLD_A = '11111111-1111-4111-8111-111111111111';
const HOUSEHOLD_B = '22222222-2222-4222-8222-222222222222';
const GUARDIAN_A = 'guardian-e4-a';
const GUARDIAN_B = 'guardian-e4-b';
const GUARDIAN_UNLINKED = 'guardian-e4-unlinked';
const GUARDIAN_MULTI = 'guardian-e4-multi';
const encoder = new TextEncoder();

let signingPrivateKey: CryptoKey;
let signingJwk: JsonWebKey & { kid: string; alg: string; use: string };
let issuer = '';
let apiBase = '';
let jwksServer: Server;
let apiServer: Server;
let store: SQLiteStore;

function base64Url(value: string | Uint8Array): string {
  const bytes = typeof value === 'string' ? encoder.encode(value) : value;
  return Buffer.from(bytes).toString('base64url');
}

async function createSigningKey(): Promise<void> {
  const pair = await crypto.subtle.generateKey({
    name: 'RSASSA-PKCS1-v1_5',
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256',
  }, true, ['sign', 'verify']) as CryptoKeyPair;
  signingPrivateKey = pair.privateKey;
  const exported = await crypto.subtle.exportKey('jwk', pair.publicKey);
  signingJwk = { ...exported, kid: 'e4-staging-key', alg: 'RS256', use: 'sig' };
}

function listen(server: Server): Promise<string> {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
    });
  });
}

function close(server: Server | undefined): Promise<void> {
  if (!server || !server.listening) return Promise.resolve();
  return new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

async function tokenFor(subject: string, overrides: Record<string, unknown> = {}): Promise<string> {
  const now = Math.floor(NOW_MS / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: signingJwk.kid }));
  const payload = base64Url(JSON.stringify({
    iss: issuer,
    aud: AUDIENCE,
    sub: subject,
    iat: now - 5,
    exp: now + 600,
    ...overrides,
  }));
  const signingInput = `${header}.${payload}`;
  const signature = new Uint8Array(await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    signingPrivateKey,
    encoder.encode(signingInput),
  ));
  return `${signingInput}.${base64Url(signature)}`;
}

function attempt(overrides: Partial<KaniAttemptV1>): KaniAttemptV1 {
  return {
    schemaVersion: '1.0',
    attemptId: 'attempt_e4_base',
    studentId: 'student_e4_alex_a1',
    activityId: 'e4.authenticated.acceptance',
    activityType: 'quiz',
    sourceApp: 'game-app',
    subjectId: 'grade4math',
    topicId: 'patterns',
    pageId: 'patterns.e4',
    skillIds: ['patterns.recognize_repetition'],
    difficulty: 'medium',
    correct: true,
    partialCredit: 1,
    responseTimeMs: 2000,
    hintsUsed: 0,
    score: 1,
    completedAt: '2027-01-15T12:00:00.000Z',
    ...overrides,
  };
}

async function callApi(
  path: string,
  options: {
    token?: string;
    householdId?: string;
    origin?: string;
    method?: string;
    body?: unknown;
  } = {},
): Promise<Response> {
  const headers = new Headers();
  headers.set('Origin', options.origin ?? ALLOWED_ORIGIN);
  if (options.token) headers.set('Authorization', `Bearer ${options.token}`);
  if (options.householdId) headers.set('x-kani-household-id', options.householdId);
  if (options.body !== undefined) headers.set('content-type', 'application/json');
  return fetch(`${apiBase}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

beforeAll(async () => {
  await createSigningKey();
  jwksServer = createServer((request, response) => {
    if (request.url !== '/.well-known/jwks.json') {
      response.statusCode = 404;
      response.end();
      return;
    }
    response.statusCode = 200;
    response.setHeader('content-type', 'application/json');
    response.setHeader('cache-control', 'public, max-age=300');
    response.end(JSON.stringify({ keys: [signingJwk] }));
  });
  const oidcBase = await listen(jwksServer);
  issuer = `${oidcBase}/issuer`;

  store = new SQLiteStore({ now: () => new Date(NOW_MS).toISOString() });
  await store.households.put({ householdId: HOUSEHOLD_A });
  await store.households.put({ householdId: HOUSEHOLD_B });
  await store.memberships.put({ householdId: HOUSEHOLD_A, userId: GUARDIAN_A, role: 'guardian' });
  await store.memberships.put({ householdId: HOUSEHOLD_B, userId: GUARDIAN_B, role: 'guardian' });
  await store.memberships.put({ householdId: HOUSEHOLD_A, userId: GUARDIAN_MULTI, role: 'guardian' });
  await store.memberships.put({ householdId: HOUSEHOLD_B, userId: GUARDIAN_MULTI, role: 'guardian' });
  await store.students.put({ householdId: HOUSEHOLD_A, studentId: 'student_e4_alex_a1', name: 'Alex', avatar: '🧑‍🚀', grade: 'Grade 4' });
  await store.students.put({ householdId: HOUSEHOLD_A, studentId: 'student_e4_alex_a2', name: 'Alex', avatar: '🧑‍🚀', grade: 'Grade 4' });
  await store.students.put({ householdId: HOUSEHOLD_B, studentId: 'student_e4_alex_b1', name: 'Alex', avatar: '🧑‍🚀', grade: 'Grade 4' });

  const identityProvider = new OidcRequestIdentityProvider({
    issuer,
    audience: AUDIENCE,
    jwksUrl: `${oidcBase}/.well-known/jwks.json`,
    now: () => NOW_MS,
    clockSkewSeconds: 30,
  });
  const app = new KaniApiApp({
    store,
    identityProvider,
    allowedOrigins: [ALLOWED_ORIGIN],
    now: () => NOW_MS,
    releaseSha: 'e4-hosted-runner',
    contractSourceSha: '6e27d8da1efbb043826ee84ff70b7bf216bf611e',
  });
  apiServer = createKaniNodeServer(app);
  apiBase = await listen(apiServer);
});

afterAll(async () => {
  await Promise.all([close(apiServer), close(jwksServer)]);
  store?.close();
});

describe('E4 connector-free authenticated acceptance over real HTTP', () => {
  it('keeps health public but denies learner data without a verified bearer identity', async () => {
    const live = await callApi('/health/live');
    expect(live.status).toBe(200);
    expect(await live.json()).toEqual({ status: 'ok' });

    const denied = await callApi('/api/v1/students', { householdId: HOUSEHOLD_A });
    expect(denied.status).toBe(401);
    expect(await denied.json()).toMatchObject({ error: { code: 'AUTHORIZATION_REQUIRED' } });
  });

  it('enforces exact CORS before authenticated application operations', async () => {
    const guardianA = await tokenFor(GUARDIAN_A);
    const allowed = await callApi('/api/v1/students', { token: guardianA, householdId: HOUSEHOLD_A });
    expect(allowed.status).toBe(200);
    expect(allowed.headers.get('access-control-allow-origin')).toBe(ALLOWED_ORIGIN);

    const denied = await callApi('/api/v1/students', {
      token: guardianA,
      householdId: HOUSEHOLD_A,
      origin: 'https://evil.example.test',
    });
    expect(denied.status).toBe(403);
    expect(denied.headers.get('access-control-allow-origin')).toBeNull();
    expect(await denied.json()).toMatchObject({ error: { code: 'ORIGIN_NOT_ALLOWED' } });
  });

  it('isolates two guardians and treats household selection only as a server-validated selector', async () => {
    const guardianA = await tokenFor(GUARDIAN_A);
    const guardianB = await tokenFor(GUARDIAN_B);

    const ownA = await callApi('/api/v1/students', { token: guardianA, householdId: HOUSEHOLD_A });
    const bodyA = await ownA.json() as { students: Array<{ id: string; name: string }> };
    expect(ownA.status).toBe(200);
    expect(bodyA.students.map((student) => student.id)).toEqual(['student_e4_alex_a1', 'student_e4_alex_a2']);
    expect(bodyA.students.map((student) => student.name)).toEqual(['Alex', 'Alex']);

    const ownB = await callApi('/api/v1/students', { token: guardianB, householdId: HOUSEHOLD_B });
    expect(ownB.status).toBe(200);
    expect((await ownB.json() as { students: Array<{ id: string }> }).students.map((student) => student.id))
      .toEqual(['student_e4_alex_b1']);

    const crossA = await callApi('/api/v1/students', { token: guardianA, householdId: HOUSEHOLD_B });
    const crossB = await callApi('/api/v1/students', { token: guardianB, householdId: HOUSEHOLD_A });
    expect(crossA.status).toBe(403);
    expect(crossB.status).toBe(403);
    expect(await crossA.json()).toMatchObject({ error: { code: 'HOUSEHOLD_FORBIDDEN' } });
  });

  it('fails closed for unlinked and multi-household guardians', async () => {
    const unlinked = await callApi('/api/v1/students', { token: await tokenFor(GUARDIAN_UNLINKED) });
    expect(unlinked.status).toBe(403);
    expect(await unlinked.json()).toMatchObject({ error: { code: 'HOUSEHOLD_NOT_LINKED' } });

    const ambiguous = await callApi('/api/v1/students', { token: await tokenFor(GUARDIAN_MULTI) });
    expect(ambiguous.status).toBe(409);
    expect(await ambiguous.json()).toMatchObject({ error: { code: 'HOUSEHOLD_SELECTION_REQUIRED' } });
  });

  it('rejects a correctly signed token with the wrong issuer', async () => {
    const denied = await callApi('/api/v1/students', {
      token: await tokenFor(GUARDIAN_A, { iss: 'https://attacker.example.test' }),
      householdId: HOUSEHOLD_A,
    });
    expect(denied.status).toBe(401);
    expect(await denied.json()).toMatchObject({ error: { code: 'JWT_ISSUER_INVALID' } });
  });

  it('preserves stable student identity idempotency and conflict behavior', async () => {
    const guardianA = await tokenFor(GUARDIAN_A);
    const profile = { id: 'student_e4_imported', name: 'Sam', avatar: '🧑‍🚀', grade: 'Grade 4' };
    const created = await callApi('/api/v1/students', { token: guardianA, householdId: HOUSEHOLD_A, method: 'POST', body: profile });
    expect(created.status).toBe(201);
    expect(await created.json()).toMatchObject({ created: true, student: { id: profile.id } });

    const replay = await callApi('/api/v1/students', { token: guardianA, householdId: HOUSEHOLD_A, method: 'POST', body: profile });
    expect(replay.status).toBe(200);
    expect(await replay.json()).toMatchObject({ created: false, student: { id: profile.id } });

    const conflict = await callApi('/api/v1/students', {
      token: guardianA,
      householdId: HOUSEHOLD_A,
      method: 'POST',
      body: { ...profile, grade: 'Grade 5' },
    });
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({ error: { code: 'STUDENT_ID_CONFLICT' } });
  });

  it('preserves immutable attempt idempotency, deterministic cursor history and evidence derivation', async () => {
    const guardianA = await tokenFor(GUARDIAN_A);
    const first = attempt({ attemptId: 'attempt_e4_a', correct: false, partialCredit: 0, score: 0 });
    const second = attempt({ attemptId: 'attempt_e4_z', correct: true, partialCredit: 1, score: 1 });
    const upload = await callApi('/api/v1/attempts', {
      token: guardianA, householdId: HOUSEHOLD_A, method: 'POST', body: { attempts: [first, second] },
    });
    expect(upload.status).toBe(200);
    expect(await upload.json()).toMatchObject({ accepted: 2, created: 2, existing: 0, idempotentReplay: false });

    const replay = await callApi('/api/v1/attempts', {
      token: guardianA, householdId: HOUSEHOLD_A, method: 'POST', body: { attempts: [first, second] },
    });
    expect(replay.status).toBe(200);
    expect(await replay.json()).toMatchObject({ accepted: 2, created: 0, existing: 2, idempotentReplay: true });

    const conflict = await callApi('/api/v1/attempts', {
      token: guardianA,
      householdId: HOUSEHOLD_A,
      method: 'POST',
      body: { attempts: [{ ...first, score: 99 }] },
    });
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({ error: { code: 'ATTEMPT_ID_CONFLICT' } });

    const page1 = await callApi('/api/v1/students/student_e4_alex_a1/history?limit=1', { token: guardianA, householdId: HOUSEHOLD_A });
    expect(page1.status).toBe(200);
    const history1 = await page1.json() as { attempts: KaniAttemptV1[]; nextCursor: string | null };
    expect(history1.attempts.map((item) => item.attemptId)).toEqual(['attempt_e4_z']);
    expect(history1.nextCursor).toBeTruthy();

    const page2 = await callApi(`/api/v1/students/student_e4_alex_a1/history?limit=1&cursor=${encodeURIComponent(history1.nextCursor as string)}`, {
      token: guardianA, householdId: HOUSEHOLD_A,
    });
    const history2 = await page2.json() as { attempts: KaniAttemptV1[]; nextCursor: string | null };
    expect(history2.attempts.map((item) => item.attemptId)).toEqual(['attempt_e4_a']);
    expect(history2.nextCursor).toBeNull();

    const revision = await callApi('/api/v1/students/student_e4_alex_a1/revision', { token: guardianA, householdId: HOUSEHOLD_A });
    expect(revision.status).toBe(200);
    const revisionBody = await revision.json() as Record<string, unknown>;
    expect(revisionBody).toMatchObject({ schemaVersion: '1.0', studentId: 'student_e4_alex_a1', evidenceAttemptCount: 2 });
    expect('mastery' in revisionBody).toBe(false);

    const recommendations = await callApi('/api/v1/students/student_e4_alex_a1/recommendations', { token: guardianA, householdId: HOUSEHOLD_A });
    expect(recommendations.status).toBe(200);
    expect(await recommendations.json()).toMatchObject({ schemaVersion: '1.0', studentId: 'student_e4_alex_a1', evidenceAttemptCount: 2 });
  });

  it('denies cross-household student history even when the stable student id is known', async () => {
    const guardianB = await tokenFor(GUARDIAN_B);
    const denied = await callApi('/api/v1/students/student_e4_alex_a1/history', { token: guardianB, householdId: HOUSEHOLD_B });
    expect(denied.status).toBe(404);
    expect(await denied.json()).toMatchObject({ error: { code: 'STUDENT_NOT_FOUND' } });
  });
});
