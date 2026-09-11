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
  it('keeps one immutable local attempt and never creates a second remote attempt when the same completion is replayed', async () => {
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

    const remoteAttemptIds = new Set<string>();
    const uploads: Array<{ created: number; existing: number }> = [];
    const coordinator = new AttemptSyncCoordinator(queue, {
      async uploadAttempts(attempts) {
        let created = 0;
        let existing = 0;
        for (const value of attempts) {
          if (remoteAttemptIds.has(value.attemptId)) existing += 1;
          else {
            remoteAttemptIds.add(value.attemptId);
            created += 1;
          }
        }
        uploads.push({ created, existing });
        return {
          accepted: attempts.length,
          created,
          existing,
          idempotentReplay: existing > 0 && created === 0,
        };
      },
    });

    const firstSync = await coordinator.flush({ nowMs: Date.now() + 60_000 });
    expect(firstSync).toEqual({ attempted: 1, synced: 1, blocked: 0, deferred: 0 });
    expect(uploads[0]).toEqual({ created: 1, existing: 0 });
    expect(remoteAttemptIds.size).toBe(1);
    expect(queue.counts().total).toBe(0);
    expect(await localStore.listAttempts('student_alpha')).toHaveLength(1);

    // A later client replay may queue the immutable attempt again; remote
    // idempotency must treat it as existing rather than count a second attempt.
    await localFirst.recordAttempt(attempt);
    expect(await localStore.listAttempts('student_alpha')).toHaveLength(1);
    expect(queue.counts().total).toBe(1);

    const replaySync = await coordinator.flush({ nowMs: Date.now() + 120_000 });
    expect(replaySync).toEqual({ attempted: 1, synced: 1, blocked: 0, deferred: 0 });
    expect(uploads[1]).toEqual({ created: 0, existing: 1 });
    expect(remoteAttemptIds.size).toBe(1);
    expect(queue.counts().total).toBe(0);
    expect(await localStore.listAttempts('student_alpha')).toHaveLength(1);
  });
});
