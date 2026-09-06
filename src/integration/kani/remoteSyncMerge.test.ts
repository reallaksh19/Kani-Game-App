import { describe, expect, it } from 'vitest';
import { StudentProfile } from '../../types';
import { AttemptStore } from './AttemptStore';
import { KaniAttemptV1 } from './contracts';
import { mergeAttemptHistory } from './mergeAttemptHistory';
import { AttemptHistoryClient, RemoteAwareAttemptStore } from './RemoteAwareAttemptStore';
import { importLocalStudentProfiles, planStudentProfileSync, StudentProfileClient } from './StudentProfileSync';

function attempt(overrides: Partial<KaniAttemptV1> = {}): KaniAttemptV1 {
  return {
    schemaVersion: '1.0',
    attemptId: 'attempt_1',
    studentId: 'student_a',
    activityId: 'studyhub:number-system',
    activityType: 'worksheet',
    sourceApp: 'study-hub',
    topicId: 'grade4math-number-system',
    skillIds: ['place-value'],
    difficulty: 'medium',
    correct: true,
    partialCredit: 1,
    completedAt: '2026-09-06T07:00:00.000Z',
    ...overrides,
  };
}

function profile(overrides: Partial<StudentProfile> = {}): StudentProfile {
  return {
    id: 'student_alex_1',
    name: 'Alex',
    avatar: '🚀',
    grade: 'Grade 4',
    createdAt: '2026-09-01T00:00:00.000Z',
    lastLoginAt: '2026-09-06T07:00:00.000Z',
    ...overrides,
  };
}

describe('mergeAttemptHistory', () => {
  it('deduplicates identical local/remote replay and includes remote-only evidence', () => {
    const local = attempt({ attemptId: 'shared', completedAt: '2026-09-06T07:00:00.000Z' });
    const remoteOnly = attempt({ attemptId: 'remote', completedAt: '2026-09-06T08:00:00.000Z' });
    const merged = mergeAttemptHistory([local], [{ ...local }, remoteOnly]);

    expect(merged.conflicts).toEqual([]);
    expect(merged.attempts.map((item) => item.attemptId)).toEqual(['remote', 'shared']);
  });

  it('surfaces impossible immutable-id conflicts and preserves the local event', () => {
    const local = attempt({ attemptId: 'same', partialCredit: 0, correct: false });
    const remote = attempt({ attemptId: 'same', partialCredit: 1, correct: true });
    const merged = mergeAttemptHistory([local], [remote]);

    expect(merged.conflicts).toHaveLength(1);
    expect(merged.conflicts[0].attemptId).toBe('same');
    expect(merged.attempts).toHaveLength(1);
    expect(merged.attempts[0].partialCredit).toBe(0);
  });
});

describe('student profile sync', () => {
  it('plans imports by stable id, not by display name', () => {
    const localA = profile({ id: 'student_a', name: 'Sam' });
    const localB = profile({ id: 'student_b', name: 'Sam' });
    const remoteB = { id: 'student_b', name: 'Sam', avatar: '🚀', grade: 'Grade 4' };
    const remoteC = { id: 'student_c', name: 'Sam', avatar: '⭐', grade: 'Grade 4' };

    const plan = planStudentProfileSync([localA, localB], [remoteB, remoteC]);
    expect(plan.imports.map((item) => item.id)).toEqual(['student_a']);
    expect(plan.alreadyLinked.map((item) => item.id)).toEqual(['student_b']);
    expect(plan.remoteOnly.map((item) => item.id)).toEqual(['student_c']);
    expect(plan.conflicts).toEqual([]);
  });

  it('refuses automatic imports if a stable id conflicts with remote profile data', async () => {
    const imported: string[] = [];
    const api: StudentProfileClient = {
      async listStudents() {
        return [{ id: 'student_alex_1', name: 'Different', avatar: '⭐', grade: 'Grade 4' }];
      },
      async importStudent(student) {
        imported.push(student.id);
        return student;
      },
    };

    const result = await importLocalStudentProfiles(api, [profile()]);
    expect(result.conflicts).toHaveLength(1);
    expect(imported).toEqual([]);
  });
});

describe('RemoteAwareAttemptStore', () => {
  it('merges paginated remote evidence with local history and reapplies filters', async () => {
    const local: AttemptStore = {
      async recordAttempt() {},
      async listAttempts() {
        return [attempt({ attemptId: 'local', topicId: 'topic_a', completedAt: '2026-09-06T07:00:00.000Z' })];
      },
    };
    let calls = 0;
    const api: AttemptHistoryClient = {
      async getHistory(_studentId, options) {
        calls += 1;
        if (!options?.cursor) {
          return {
            attempts: [attempt({ attemptId: 'remote_b', topicId: 'topic_b', completedAt: '2026-09-06T09:00:00.000Z' })],
            nextCursor: 'next',
          };
        }
        return {
          attempts: [attempt({ attemptId: 'remote_a', topicId: 'topic_a', completedAt: '2026-09-06T08:00:00.000Z' })],
          nextCursor: null,
        };
      },
    };

    const store = new RemoteAwareAttemptStore({ localStore: local, api });
    const values = await store.listAttempts('student_a', { topicId: 'topic_a' });
    expect(calls).toBe(2);
    expect(values.map((item) => item.attemptId)).toEqual(['remote_a', 'local']);
  });

  it('falls back to local history when remote auth/network is unavailable', async () => {
    const localValue = attempt({ attemptId: 'local_only' });
    const local: AttemptStore = {
      async recordAttempt() {},
      async listAttempts() { return [localValue]; },
    };
    let errorSeen = false;
    const api: AttemptHistoryClient = {
      async getHistory() { throw new Error('offline'); },
    };
    const store = new RemoteAwareAttemptStore({
      localStore: local,
      api,
      onRemoteReadError: () => { errorSeen = true; },
    });

    expect((await store.listAttempts('student_a')).map((item) => item.attemptId)).toEqual(['local_only']);
    expect(errorSeen).toBe(true);
  });
});
