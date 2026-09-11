import { describe, expect, it } from 'vitest';
import { LocalAttemptStore } from './AttemptStore';
import { LocalAttemptSyncQueue } from './AttemptSyncQueue';
import { AttemptSyncCoordinator } from './AttemptSyncCoordinator';
import { KaniAttemptV1 } from './contracts';
import { LocalFirstAttemptStore } from './LocalFirstAttemptStore';

class MemoryStorage {
  private readonly data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

function primaryMissionAttempt(): KaniAttemptV1 {
  return {
    schemaVersion: '1.0',
    attemptId: 'primary_P4FE7K2Q:fraction-equiv-q-101',
    studentId: 'student_alpha',
    activityId: 'KM-G4-FRAC-EQUIV-001',
    activityType: 'game',
    sourceApp: 'game-app',
    subjectId: 'mathematics',
    topicId: 'topic_grade4-fractions',
    pageId: 'page_grade4-fractions-primary-equivalence',
    questionId: 'fraction-equiv-q-101',
    skillIds: ['skill_fraction-equivalence'],
    difficulty: 'easy',
    correct: true,
    partialCredit: 1,
    responseTimeMs: 2200,
    hintsUsed: 0,
    primaryEvidence: {
      semanticVersion: '1.0',
      learningEpisodeId: 'EP-G4-FRAC-EQUIV-001',
      learningObjectIds: ['MATH-FRAC-EQUIVALENCE'],
    },
    startedAt: '2026-09-11T05:00:00.000Z',
    completedAt: '2026-09-11T05:00:02.200Z',
  };
}

describe('Phase 3 Primary mission offline attempt idempotency', () => {
  it('keeps one immutable local attempt and one outbox entry when the same attempt is recorded twice, then removes the outbox entry after sync', async () => {
    const storage = new MemoryStorage();
    const localStore = new LocalAttemptStore({ storage, storageKey: 'phase3-attempts' });
    const queue = new LocalAttemptSyncQueue({ storage, storageKey: 'phase3-outbox' });
    const localFirst = new LocalFirstAttemptStore({
      localStore,
      syncQueue: queue,
      queueEnabled: true,
    });
    const attempt = primaryMissionAttempt();

    // Simulates an offline completion being replayed by the client before sync.
    await localFirst.recordAttempt(attempt);
    await localFirst.recordAttempt(attempt);

    expect(await localStore.listAttempts('student_alpha')).toHaveLength(1);
    expect(queue.counts()).toEqual({ pending: 1, retrying: 0, blocked: 0, total: 1 });

    const uploaded: KaniAttemptV1[][] = [];
    const coordinator = new AttemptSyncCoordinator(queue, {
      async uploadAttempts(attempts) {
        uploaded.push([...attempts]);
        return {
          accepted: attempts.length,
          created: attempts.length,
          existing: 0,
          idempotentReplay: false,
        };
      },
    });

    const result = await coordinator.flush({ nowMs: Date.parse('2026-09-11T05:01:00.000Z') });
    expect(result).toEqual({ attempted: 1, synced: 1, blocked: 0, deferred: 0 });
    expect(uploaded).toHaveLength(1);
    expect(uploaded[0]).toHaveLength(1);
    expect(uploaded[0][0].attemptId).toBe(attempt.attemptId);
    expect(queue.counts().total).toBe(0);
    expect(await localStore.listAttempts('student_alpha')).toHaveLength(1);

    // A later retry of the same immutable completion stays idempotent locally.
    await localFirst.recordAttempt(attempt);
    expect(await localStore.listAttempts('student_alpha')).toHaveLength(1);
    expect(queue.counts().total).toBe(1);
  });
});
