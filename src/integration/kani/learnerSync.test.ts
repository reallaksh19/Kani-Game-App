import { describe, expect, it } from 'vitest';
import { KaniAttemptV1 } from './contracts';
import { AttemptSyncConflictError, AttemptSyncQueueFullError, LocalAttemptSyncQueue, computeRetryDelayMs } from './AttemptSyncQueue';
import { AttemptSyncCoordinator, AttemptUploadClient } from './AttemptSyncCoordinator';
import { LearnerApiClient, LearnerApiError } from './LearnerApiClient';
import { StaticGuardianSessionProvider } from './GuardianSessionProvider';
import { LocalFirstAttemptStore } from './LocalFirstAttemptStore';
import { AttemptStore } from './AttemptStore';
import { resolveLearnerSyncConfig } from './learnerSyncConfig';

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
}

function attempt(overrides: Partial<KaniAttemptV1> = {}): KaniAttemptV1 {
  return {
    schemaVersion: '1.0',
    attemptId: 'attempt_1',
    studentId: 'student_alex_1',
    activityId: 'studyhub:number-system',
    activityType: 'worksheet',
    sourceApp: 'study-hub',
    topicId: 'grade4math-number-system',
    questionId: 'number-system-q01',
    skillIds: ['place-value'],
    difficulty: 'medium',
    correct: false,
    partialCredit: 0,
    responseTimeMs: 3200,
    completedAt: '2026-09-06T07:00:00.000Z',
    ...overrides,
  };
}

describe('learner sync configuration', () => {
  it('is fail-closed until the flag and public API/auth configuration are all present', () => {
    expect(resolveLearnerSyncConfig({}).ready).toBe(false);
    const requested = resolveLearnerSyncConfig({ VITE_KANI_SYNC_ENABLED: 'true' });
    expect(requested.ready).toBe(false);
    expect(requested.reason).toMatch(/API base URL/i);

    const ready = resolveLearnerSyncConfig({
      VITE_KANI_SYNC_ENABLED: 'true',
      VITE_KANI_API_BASE_URL: 'https://project.supabase.co/functions/v1/kani-api/api/v1/',
      VITE_SUPABASE_URL: 'https://project.supabase.co/',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
    });
    expect(ready.ready).toBe(true);
    expect(ready.apiBaseUrl.endsWith('/')).toBe(false);
  });
});

describe('LocalAttemptSyncQueue', () => {
  it('keeps immutable canonical attempts separate from retry metadata', () => {
    const queue = new LocalAttemptSyncQueue({ storage: new MemoryStorage() });
    const value = attempt();
    queue.enqueue(value, 1000);
    queue.enqueue({ ...value }, 2000);
    expect(queue.listAll()).toHaveLength(1);

    expect(() => queue.enqueue(attempt({ partialCredit: 1, correct: true }), 3000))
      .toThrow(AttemptSyncConflictError);
  });

  it('fails a new enqueue instead of silently dropping older pending evidence when full', () => {
    const queue = new LocalAttemptSyncQueue({ storage: new MemoryStorage(), maxEntries: 2 });
    queue.enqueue(attempt({ attemptId: 'oldest' }), 1000);
    queue.enqueue(attempt({ attemptId: 'newer' }), 2000);

    expect(() => queue.enqueue(attempt({ attemptId: 'overflow' }), 3000))
      .toThrow(AttemptSyncQueueFullError);
    expect(queue.listAll().map((entry) => entry.attempt.attemptId)).toEqual(['newer', 'oldest']);
  });

  it('uses bounded exponential retry and respects Retry-After', () => {
    const queue = new LocalAttemptSyncQueue({ storage: new MemoryStorage() });
    queue.enqueue(attempt(), 1000);
    queue.markFailed(['attempt_1'], 'rate limited', {
      nowMs: 1000,
      retryAfterSeconds: 10,
      random: () => 0.5,
    });
    const entry = queue.listAll()[0];
    expect(entry.meta.state).toBe('retrying');
    expect(Date.parse(entry.meta.nextAttemptAt || '')).toBe(11000);
    expect(queue.listReady(10999)).toHaveLength(0);
    expect(queue.listReady(11000)).toHaveLength(1);
    expect(computeRetryDelayMs(1, () => 0.5)).toBe(2000);
  });

  it('blocks terminal conflicts without deleting local evidence', () => {
    const queue = new LocalAttemptSyncQueue({ storage: new MemoryStorage() });
    queue.enqueue(attempt(), 1000);
    queue.markFailed(['attempt_1'], 'immutable conflict', { nowMs: 2000, terminal: true });
    expect(queue.counts()).toEqual({ pending: 0, retrying: 0, blocked: 1, total: 1 });
    expect(queue.listReady(999999)).toHaveLength(0);
  });
});

describe('LearnerApiClient', () => {
  it('sends the guardian JWT, publishable key and optional household selector', async () => {
    let receivedHeaders: Headers | null = null;
    const fetchImpl: typeof fetch = async (_input, init) => {
      receivedHeaders = new Headers(init?.headers);
      return new Response(JSON.stringify({ students: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };
    const client = new LearnerApiClient({
      baseUrl: 'https://project.supabase.co/functions/v1/kani-api/api/v1',
      sessionProvider: new StaticGuardianSessionProvider({ userId: 'guardian-1', accessToken: 'jwt-token' }),
      publishableKey: 'sb_publishable_key',
      householdIdProvider: () => '11111111-1111-4111-8111-111111111111',
      fetchImpl,
    });

    await client.listStudents();
    const headers = receivedHeaders as Headers | null;
    expect(headers?.get('authorization')).toBe('Bearer jwt-token');
    expect(headers?.get('apikey')).toBe('sb_publishable_key');
    expect(headers?.get('x-kani-household-id')).toBe('11111111-1111-4111-8111-111111111111');
  });

  it('fails before network access when no guardian session exists', async () => {
    let called = false;
    const fetchImpl: typeof fetch = async () => {
      called = true;
      return new Response('{}');
    };
    const client = new LearnerApiClient({
      baseUrl: 'https://example.test/api/v1',
      sessionProvider: new StaticGuardianSessionProvider(null),
      fetchImpl,
    });
    await expect(client.listStudents()).rejects.toMatchObject({ code: 'UNAUTHENTICATED', status: 401 });
    expect(called).toBe(false);
  });
});

describe('local-first store and coordinator', () => {
  it('keeps the local write successful when queue storage fails', async () => {
    const saved: KaniAttemptV1[] = [];
    const localStore: AttemptStore = {
      async recordAttempt(value) { saved.push(value); },
      async listAttempts() { return saved; },
    };
    const brokenQueue = new LocalAttemptSyncQueue({
      storage: {
        getItem: () => null,
        setItem: () => { throw new Error('quota exceeded'); },
      },
    });
    let queueError: unknown;
    const store = new LocalFirstAttemptStore({
      localStore,
      syncQueue: brokenQueue,
      queueEnabled: true,
      onQueueError: (error) => { queueError = error; },
    });

    await expect(store.recordAttempt(attempt())).resolves.toBeUndefined();
    expect(saved).toHaveLength(1);
    expect(queueError).toBeInstanceOf(Error);
  });

  it('flushes a ready batch and removes queue metadata only after API success', async () => {
    const queue = new LocalAttemptSyncQueue({ storage: new MemoryStorage() });
    queue.enqueue(attempt({ attemptId: 'a1' }), 1000);
    queue.enqueue(attempt({ attemptId: 'a2' }), 1000);
    const api: AttemptUploadClient = {
      uploadAttempts: async (values) => ({
        accepted: values.length,
        created: values.length,
        existing: 0,
        idempotentReplay: false,
      }),
    };
    const coordinator = new AttemptSyncCoordinator(queue, api);
    const result = await coordinator.flush({ nowMs: 1000 });
    expect(result).toEqual({ attempted: 2, synced: 2, blocked: 0, deferred: 0 });
    expect(queue.counts().total).toBe(0);
  });

  it('leaves evidence pending when sign-in or profile linkage is not ready', async () => {
    const queue = new LocalAttemptSyncQueue({ storage: new MemoryStorage() });
    queue.enqueue(attempt(), 1000);
    const api: AttemptUploadClient = {
      uploadAttempts: async () => {
        throw new LearnerApiError('sign in', { status: 401, code: 'UNAUTHENTICATED' });
      },
    };
    const coordinator = new AttemptSyncCoordinator(queue, api);
    const result = await coordinator.flush({ nowMs: 1000 });
    expect(result.deferred).toBe(1);
    expect(result.reason).toBe('UNAUTHENTICATED');
    expect(queue.counts().pending).toBe(1);
  });
});
