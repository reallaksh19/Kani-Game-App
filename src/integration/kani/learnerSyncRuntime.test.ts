import { describe, expect, it } from 'vitest';
import { AttemptStore } from './AttemptStore';
import { LocalAttemptSyncQueue } from './AttemptSyncQueue';
import { KaniAttemptV1 } from './contracts';
import { LocalFirstAttemptStore } from './LocalFirstAttemptStore';
import { resolveLearnerSyncConfig } from './learnerSyncConfig';

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
}

function attempt(): KaniAttemptV1 {
  return {
    schemaVersion: '1.0',
    attemptId: 'attempt_runtime_1',
    studentId: 'student_alex_1',
    activityId: 'studyhub:number-system',
    activityType: 'worksheet',
    sourceApp: 'study-hub',
    topicId: 'grade4math-number-system',
    questionId: 'number-system-q01',
    skillIds: ['place-value'],
    difficulty: 'medium',
    correct: true,
    partialCredit: 1,
    responseTimeMs: 2500,
    completedAt: '2026-09-06T08:30:00.000Z',
  };
}

describe('automatic learner sync seams', () => {
  it('preserves an explicit household selector as public runtime configuration', () => {
    const config = resolveLearnerSyncConfig({
      VITE_KANI_SYNC_ENABLED: 'true',
      VITE_KANI_API_BASE_URL: 'https://project.supabase.co/functions/v1/kani-api/api/v1',
      VITE_SUPABASE_URL: 'https://project.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
      VITE_KANI_HOUSEHOLD_ID: '11111111-1111-4111-8111-111111111111',
    });

    expect(config.ready).toBe(true);
    expect(config.householdId).toBe('11111111-1111-4111-8111-111111111111');
  });

  it('signals only after canonical evidence was saved locally and queued successfully', async () => {
    const saved: KaniAttemptV1[] = [];
    const localStore: AttemptStore = {
      async recordAttempt(value) { saved.push(value); },
      async listAttempts() { return saved; },
    };
    const queue = new LocalAttemptSyncQueue({ storage: new MemoryStorage() });
    const queued: string[] = [];
    const store = new LocalFirstAttemptStore({
      localStore,
      syncQueue: queue,
      queueEnabled: true,
      onQueued: (value) => queued.push(value.attemptId),
    });

    await store.recordAttempt(attempt());
    expect(saved.map((value) => value.attemptId)).toEqual(['attempt_runtime_1']);
    expect(queue.counts().total).toBe(1);
    expect(queued).toEqual(['attempt_runtime_1']);
  });

  it('does not emit a sync signal when outbox persistence fails', async () => {
    const saved: KaniAttemptV1[] = [];
    const localStore: AttemptStore = {
      async recordAttempt(value) { saved.push(value); },
      async listAttempts() { return saved; },
    };
    const queue = new LocalAttemptSyncQueue({
      storage: {
        getItem: () => null,
        setItem: () => { throw new Error('quota exceeded'); },
      },
    });
    let signalled = false;
    let queueError: unknown;
    const store = new LocalFirstAttemptStore({
      localStore,
      syncQueue: queue,
      queueEnabled: true,
      onQueued: () => { signalled = true; },
      onQueueError: (error) => { queueError = error; },
    });

    await expect(store.recordAttempt(attempt())).resolves.toBeUndefined();
    expect(saved).toHaveLength(1);
    expect(signalled).toBe(false);
    expect(queueError).toBeInstanceOf(Error);
  });
});
