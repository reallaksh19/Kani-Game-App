import { describe, expect, it } from 'vitest';
import type { KaniAttemptV1 } from '../../integration/kani/contracts';
import type { AttemptRepository, KeyValueStorage } from '../../ports/storage';
import { LocalAttemptStore } from './local/LocalAttemptStore';
import { MemoryStore } from './memory/MemoryStore';
import { SQLiteStore } from './sqlite/SQLiteStore';

class MemoryKeyValueStorage implements KeyValueStorage {
  private readonly data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
}

function attempt(overrides: Partial<KaniAttemptV1> = {}): KaniAttemptV1 {
  return {
    schemaVersion: '1.0',
    attemptId: 'attempt_base',
    studentId: 'student_a',
    activityId: 'activity_fraction',
    activityType: 'worksheet',
    sourceApp: 'game-app',
    topicId: 'topic_fraction',
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

const adapters: Array<{ name: string; create: () => Promise<AttemptRepository> }> = [
  { name: 'MemoryStore', create: async () => new MemoryStore().attempts },
  { name: 'LocalAttemptStore', create: async () => new LocalAttemptStore({ storage: new MemoryKeyValueStorage(), maxAttempts: 50 }) },
  {
    name: 'SQLiteStore',
    create: async () => {
      const store = new SQLiteStore();
      await store.households.put({ householdId: 'house_a' });
      await store.households.put({ householdId: 'house_b' });
      await store.students.put({ householdId: 'house_a', studentId: 'student_a', name: 'A', avatar: '🧑‍🚀', grade: '4' });
      await store.students.put({ householdId: 'house_b', studentId: 'student_b', name: 'B', avatar: '🧑‍🚀', grade: '4' });
      return store.attempts;
    },
  },
];

for (const adapter of adapters) {
  describe(`${adapter.name} attempt conformance`, () => {
    it('isolates evidence by stable studentId', async () => {
      const store = await adapter.create();
      await store.recordAttempt(attempt({ attemptId: 'a1', studentId: 'student_a' }));
      await store.recordAttempt(attempt({ attemptId: 'b1', studentId: 'student_b' }));
      expect((await store.listAttempts('student_a')).map((item) => item.attemptId)).toEqual(['a1']);
      expect((await store.listAttempts('student_b')).map((item) => item.attemptId)).toEqual(['b1']);
    });

    it('accepts identical replay and rejects conflicting immutable attemptId', async () => {
      const store = await adapter.create();
      const original = attempt({ attemptId: 'same', score: 5 });
      await store.recordAttempt(original);
      await store.recordAttempt({ ...original });
      await expect(store.recordAttempt({ ...original, score: 9 })).rejects.toThrow();
      const saved = await store.listAttempts('student_a');
      expect(saved).toHaveLength(1);
      expect(saved[0].score).toBe(5);
    });

    it('filters and orders history deterministically', async () => {
      const store = await adapter.create();
      await store.recordAttempt(attempt({ attemptId: 'a', completedAt: '2026-09-05T13:51:00.000Z' }));
      await store.recordAttempt(attempt({ attemptId: 'b', completedAt: '2026-09-05T13:52:00.000Z', skillIds: ['other'] }));
      await store.recordAttempt(attempt({ attemptId: 'c', completedAt: '2026-09-05T13:52:00.000Z' }));
      expect((await store.listAttempts('student_a')).map((item) => item.attemptId)).toEqual(['c', 'b', 'a']);
      expect((await store.listAttempts('student_a', { skillId: 'skill_fractions', limit: 1 })).map((item) => item.attemptId)).toEqual(['c']);
      expect(await store.listAttempts('')).toEqual([]);
    });

    it('rejects malformed canonical attempts', async () => {
      const store = await adapter.create();
      await expect(store.recordAttempt(attempt({ studentId: '', partialCredit: 2 }))).rejects.toThrow();
    });
  });
}

describe('MemoryStore full-port semantics', () => {
  it('allows duplicate display names while preserving stable identity', async () => {
    const store = new MemoryStore();
    await store.students.put({ householdId: 'house_a', studentId: 'student_1', name: 'Alex', avatar: '🧑‍🚀', grade: '4' });
    await store.students.put({ householdId: 'house_a', studentId: 'student_2', name: 'Alex', avatar: '🧑‍🚀', grade: '4' });
    expect((await store.students.listByHousehold('house_a')).map((student) => student.studentId)).toEqual(['student_1', 'student_2']);
  });

  it('keeps membership household-scoped and rejects conflicting stable student payloads', async () => {
    const store = new MemoryStore();
    await store.memberships.put({ householdId: 'house_a', userId: 'guardian_a', role: 'guardian' });
    expect(await store.memberships.isMember('house_a', 'guardian_a')).toBe(true);
    expect(await store.memberships.isMember('house_b', 'guardian_a')).toBe(false);

    const original = { householdId: 'house_a', studentId: 'student_1', name: 'Alex', avatar: '🧑‍🚀', grade: '4' } as const;
    await store.students.put(original);
    await store.students.put({ ...original });
    await expect(store.students.put({ ...original, grade: '5' })).rejects.toThrow();
  });
});
