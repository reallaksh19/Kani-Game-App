import { describe, expect, it } from 'vitest';
import { KaniAttemptV1 } from './contracts';
import { LocalAttemptStore } from './AttemptStore';

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
}

function attempt(overrides: Partial<KaniAttemptV1>): KaniAttemptV1 {
  return {
    schemaVersion: '1.0',
    attemptId: 'attempt_1',
    studentId: 'student_a',
    activityId: 'activity_fraction',
    activityType: 'worksheet',
    sourceApp: 'game-app',
    skillIds: ['skill_fractions'],
    difficulty: 'medium',
    correct: true,
    partialCredit: 1,
    responseTimeMs: 4000,
    score: 10,
    completedAt: '2026-09-05T13:50:00.000Z',
    ...overrides,
  };
}

describe('LocalAttemptStore', () => {
  it('isolates attempts by stable studentId even when activity is shared', async () => {
    const store = new LocalAttemptStore({ storage: new MemoryStorage() });
    await store.recordAttempt(attempt({ attemptId: 'a1', studentId: 'student_a' }));
    await store.recordAttempt(attempt({ attemptId: 'b1', studentId: 'student_b' }));

    expect((await store.listAttempts('student_a')).map((item) => item.attemptId)).toEqual(['a1']);
    expect((await store.listAttempts('student_b')).map((item) => item.attemptId)).toEqual(['b1']);
  });

  it('deduplicates by attemptId and keeps the newest replacement', async () => {
    const store = new LocalAttemptStore({ storage: new MemoryStorage() });
    await store.recordAttempt(attempt({ attemptId: 'same', score: 5 }));
    await store.recordAttempt(attempt({ attemptId: 'same', score: 9, completedAt: '2026-09-05T14:00:00.000Z' }));
    const saved = await store.listAttempts('student_a');
    expect(saved).toHaveLength(1);
    expect(saved[0].score).toBe(9);
  });

  it('supports activity/topic/skill filters and history caps', async () => {
    const store = new LocalAttemptStore({ storage: new MemoryStorage(), maxAttempts: 3 });
    await store.recordAttempt(attempt({ attemptId: '1', topicId: 'topic_one', completedAt: '2026-09-05T13:51:00.000Z' }));
    await store.recordAttempt(attempt({ attemptId: '2', topicId: 'topic_two', completedAt: '2026-09-05T13:52:00.000Z' }));
    await store.recordAttempt(attempt({ attemptId: '3', topicId: 'topic_two', skillIds: ['skill_other'], completedAt: '2026-09-05T13:53:00.000Z' }));
    await store.recordAttempt(attempt({ attemptId: '4', topicId: 'topic_two', completedAt: '2026-09-05T13:54:00.000Z' }));

    expect((await store.listAttempts('student_a')).map((item) => item.attemptId)).toEqual(['4', '3', '2']);
    expect((await store.listAttempts('student_a', { topicId: 'topic_two', skillId: 'skill_fractions' })).map((item) => item.attemptId)).toEqual(['4', '2']);
    expect(await store.listAttempts('')).toEqual([]);
  });

  it('rejects malformed attempts at the write boundary', async () => {
    const store = new LocalAttemptStore({ storage: new MemoryStorage() });
    const malformed = attempt({ studentId: '', partialCredit: 2 });
    await expect(store.recordAttempt(malformed)).rejects.toThrow();
  });
});
