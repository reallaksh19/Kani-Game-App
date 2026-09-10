import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SQLiteStore } from '../../infrastructure/storage/sqlite/SQLiteStore';
import { TestRequestIdentityProvider } from '../../infrastructure/identity/test/TestRequestIdentityProvider';
import { KaniApiApp } from './KaniApiApp';
import type { KaniAttemptV1 } from '../../integration/kani/contracts';
import { MAX_REQUEST_BYTES } from './kaniApiProtocol';

const HOUSE_A = '11111111-1111-4111-8111-111111111111';
const HOUSE_B = '22222222-2222-4222-8222-222222222222';
const ORIGIN = 'https://reallaksh19.github.io';

function attempt(overrides: Partial<KaniAttemptV1> = {}): KaniAttemptV1 {
  return {
    schemaVersion: '1.0',
    attemptId: 'attempt_1',
    studentId: 'student_a1',
    activityId: 'activity.patterns',
    activityType: 'worksheet',
    sourceApp: 'game-app',
    topicId: 'topic.patterns',
    pageId: 'page.patterns',
    skillIds: ['patterns.skill'],
    difficulty: 'medium',
    correct: true,
    partialCredit: 1,
    completedAt: '2026-09-10T00:00:00.000Z',
    ...overrides,
  };
}

async function payload(response: Response): Promise<any> {
  return response.json();
}

describe('connector-free Kani API over SQLite', () => {
  let store: SQLiteStore;
  let app: KaniApiApp;

  beforeEach(async () => {
    store = new SQLiteStore({ now: () => '2026-09-10T00:00:00.000Z' });
    await store.households.put({ householdId: HOUSE_A });
    await store.households.put({ householdId: HOUSE_B });
    await store.memberships.put({ householdId: HOUSE_A, userId: 'guardian_a', role: 'guardian' });
    await store.memberships.put({ householdId: HOUSE_B, userId: 'guardian_b', role: 'guardian' });
    await store.students.put({ householdId: HOUSE_A, studentId: 'student_a1', name: 'Alex', avatar: '🧑‍🚀', grade: '4' });
    await store.students.put({ householdId: HOUSE_B, studentId: 'student_b1', name: 'Alex', avatar: '🧑‍🚀', grade: '4' });
    app = new KaniApiApp({
      store,
      identityProvider: new TestRequestIdentityProvider({ environment: 'test' }),
      allowedOrigins: [ORIGIN],
      releaseSha: 'e3-test-sha',
      contractSourceSha: 'study-hub-test-sha',
      now: () => Date.parse('2026-09-10T00:00:15.000Z'),
    });
  });

  afterEach(() => store.close());

  const request = (method: string, path: string, options: { user?: string; body?: unknown; origin?: string; householdId?: string } = {}) => {
    const headers = new Headers();
    if (options.user) headers.set('Authorization', `Bearer test:${options.user}`);
    if (options.origin !== undefined) headers.set('Origin', options.origin);
    if (options.householdId) headers.set('x-kani-household-id', options.householdId);
    let body: string | undefined;
    if (options.body !== undefined) {
      body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      headers.set('Content-Type', 'application/json');
    }
    return new Request(`http://kani.test${path}`, { method, headers, body });
  };

  it('serves live/ready/version health without authentication', async () => {
    expect((await app.handle(request('GET', '/health/live'))).status).toBe(200);
    const ready = await app.handle(request('GET', '/health/ready'));
    expect(ready.status).toBe(200);
    expect(await payload(ready)).toMatchObject({ status: 'ready', storage: 'sqlite', migrationVersion: 2 });
    const version = await payload(await app.handle(request('GET', '/health/version')));
    expect(version).toMatchObject({ apiVersion: 'v1', schemaVersion: '1.0', releaseSha: 'e3-test-sha', contractSourceSha: 'study-hub-test-sha', storage: 'sqlite' });
  });

  it('requires identity and enforces household authorization', async () => {
    const unauthenticated = await app.handle(request('GET', '/api/v1/students'));
    expect(unauthenticated.status).toBe(401);
    expect((await payload(unauthenticated)).error.code).toBe('UNAUTHENTICATED');

    const forbidden = await app.handle(request('GET', '/api/v1/students', { user: 'guardian_a', householdId: HOUSE_B }));
    expect(forbidden.status).toBe(403);
    expect((await payload(forbidden)).error.code).toBe('HOUSEHOLD_FORBIDDEN');
  });

  it('keeps duplicate display names independent by stable studentId', async () => {
    const create = await app.handle(request('POST', '/api/v1/students', {
      user: 'guardian_a',
      body: { id: 'student_a2', name: 'Alex', avatar: '🧑‍🚀', grade: '4' },
    }));
    expect(create.status).toBe(201);
    const list = await payload(await app.handle(request('GET', '/api/v1/students', { user: 'guardian_a' })));
    expect(list.students.map((student: any) => student.id)).toEqual(['student_a1', 'student_a2']);
    expect(list.students.map((student: any) => student.name)).toEqual(['Alex', 'Alex']);
  });

  it('makes student creation idempotent and rejects stable-ID profile conflicts', async () => {
    const body = { id: 'student_a2', name: 'Mira', avatar: '🧑‍🚀', grade: '4' };
    expect((await app.handle(request('POST', '/api/v1/students', { user: 'guardian_a', body }))).status).toBe(201);
    const replay = await app.handle(request('POST', '/api/v1/students', { user: 'guardian_a', body }));
    expect(replay.status).toBe(200);
    expect((await payload(replay)).created).toBe(false);
    const conflict = await app.handle(request('POST', '/api/v1/students', { user: 'guardian_a', body: { ...body, grade: '5' } }));
    expect(conflict.status).toBe(409);
    expect((await payload(conflict)).error.code).toBe('STUDENT_ID_CONFLICT');
  });

  it('uploads immutable attempts idempotently and rejects conflicting replay', async () => {
    const first = await app.handle(request('POST', '/api/v1/attempts', { user: 'guardian_a', body: { attempts: [attempt()] } }));
    expect(first.status).toBe(200);
    expect(await payload(first)).toMatchObject({ accepted: 1, created: 1, existing: 0, idempotentReplay: false });
    const replay = await payload(await app.handle(request('POST', '/api/v1/attempts', { user: 'guardian_a', body: { attempts: [attempt()] } })));
    expect(replay).toMatchObject({ accepted: 1, created: 0, existing: 1, idempotentReplay: true });
    const conflict = await app.handle(request('POST', '/api/v1/attempts', {
      user: 'guardian_a', body: { attempts: [attempt({ correct: false, partialCredit: 0 })] },
    }));
    expect(conflict.status).toBe(409);
    expect((await payload(conflict)).error.code).toBe('ATTEMPT_ID_CONFLICT');
  });

  it('paginates history deterministically by completedAt + attemptId with no gaps or duplicates', async () => {
    const attempts = [
      attempt({ attemptId: 'a', completedAt: '2026-09-10T00:00:00.000Z' }),
      attempt({ attemptId: 'b', completedAt: '2026-09-10T00:01:00.000Z' }),
      attempt({ attemptId: 'c', completedAt: '2026-09-10T00:01:00.000Z' }),
      attempt({ attemptId: 'd', completedAt: '2026-09-10T00:02:00.000Z' }),
    ];
    await app.handle(request('POST', '/api/v1/attempts', { user: 'guardian_a', body: { attempts } }));
    const first = await payload(await app.handle(request('GET', '/api/v1/students/student_a1/history?limit=2', { user: 'guardian_a' })));
    expect(first.attempts.map((item: any) => item.attemptId)).toEqual(['d', 'c']);
    expect(first.nextCursor).toBeTypeOf('string');
    const second = await payload(await app.handle(request('GET', `/api/v1/students/student_a1/history?limit=2&cursor=${encodeURIComponent(first.nextCursor)}`, { user: 'guardian_a' })));
    expect(second.attempts.map((item: any) => item.attemptId)).toEqual(['b', 'a']);
    expect(second.nextCursor).toBeNull();
    expect(new Set([...first.attempts, ...second.attempts].map((item: any) => item.attemptId)).size).toBe(4);

    const malformed = await app.handle(request('GET', '/api/v1/students/student_a1/history?cursor=not-a-cursor', { user: 'guardian_a' }));
    expect(malformed.status).toBe(400);
    expect((await payload(malformed)).error.code).toBe('INVALID_CURSOR');
  });

  it('derives revision/recommendations from bounded canonical evidence without mastery truth', async () => {
    await app.handle(request('POST', '/api/v1/attempts', { user: 'guardian_a', body: { attempts: [
      attempt({ attemptId: 'r1', correct: false, partialCredit: 0, completedAt: '2026-09-10T00:00:00.000Z' }),
      attempt({ attemptId: 'r2', correct: true, partialCredit: 1, completedAt: '2026-09-10T00:01:00.000Z' }),
      attempt({ attemptId: 'r3', correct: false, partialCredit: 0, completedAt: '2026-09-10T00:02:00.000Z' }),
    ] } }));
    const revision = await payload(await app.handle(request('GET', '/api/v1/students/student_a1/revision', { user: 'guardian_a' })));
    const recommendations = await payload(await app.handle(request('GET', '/api/v1/students/student_a1/recommendations', { user: 'guardian_a' })));
    expect(revision.evidenceAttemptCount).toBe(3);
    expect(recommendations.evidenceAttemptCount).toBe(3);
    expect(recommendations.recommendations.length).toBeGreaterThan(0);
    expect(JSON.stringify({ revision, recommendations }).toLowerCase()).not.toContain('mastery');
  });

  it('fails closed on disallowed browser origins', async () => {
    const response = await app.handle(request('GET', '/api/v1/students', { user: 'guardian_a', origin: 'https://evil.example' }));
    expect(response.status).toBe(403);
    expect((await payload(response)).error.code).toBe('ORIGIN_NOT_ALLOWED');
    const allowed = await app.handle(request('GET', '/api/v1/students', { user: 'guardian_a', origin: ORIGIN }));
    expect(allowed.headers.get('access-control-allow-origin')).toBe(ORIGIN);
  });

  it('enforces request body and batch bounds', async () => {
    const oversized = await app.handle(request('POST', '/api/v1/students', {
      user: 'guardian_a', body: JSON.stringify({ padding: 'x'.repeat(MAX_REQUEST_BYTES + 1) }),
    }));
    expect(oversized.status).toBe(413);
    expect((await payload(oversized)).error.code).toBe('PAYLOAD_TOO_LARGE');

    const tooMany = Array.from({ length: 51 }, (_, index) => attempt({ attemptId: `bulk_${index}` }));
    const batch = await app.handle(request('POST', '/api/v1/attempts', { user: 'guardian_a', body: { attempts: tooMany } }));
    expect(batch.status).toBe(413);
    expect((await payload(batch)).error.code).toBe('BATCH_TOO_LARGE');
  });

  it('enforces SQLite-backed write quota with Retry-After', async () => {
    const limited = new KaniApiApp({
      store,
      identityProvider: new TestRequestIdentityProvider({ environment: 'test' }),
      allowedOrigins: [ORIGIN],
      writeUnitsPerMinute: 1,
      now: () => Date.parse('2026-09-10T00:00:15.000Z'),
    });
    const first = await limited.handle(request('POST', '/api/v1/students', {
      user: 'guardian_a', body: { id: 'quota_1', name: 'One', avatar: '🧑‍🚀', grade: '4' },
    }));
    expect(first.status).toBe(201);
    const second = await limited.handle(request('POST', '/api/v1/students', {
      user: 'guardian_a', body: { id: 'quota_2', name: 'Two', avatar: '🧑‍🚀', grade: '4' },
    }));
    expect(second.status).toBe(429);
    expect((await payload(second)).error.code).toBe('RATE_LIMITED');
    expect(Number(second.headers.get('retry-after'))).toBeGreaterThan(0);
  });
});
