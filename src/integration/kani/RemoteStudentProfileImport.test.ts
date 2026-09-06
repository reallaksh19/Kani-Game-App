import { describe, expect, it } from 'vitest';
import { StudentProfile } from '../../types';
import { RemoteStudentProfile } from './LearnerApiClient';
import { importRemoteProfilesLocally, planRemoteProfilesForLocalImport } from './RemoteStudentProfileImport';

function local(id: string, name: string, avatar = '🦄'): StudentProfile {
  return {
    id,
    name,
    avatar,
    grade: 'Grade 4',
    createdAt: '2026-01-01T00:00:00.000Z',
    lastLoginAt: '2026-01-02T00:00:00.000Z',
  };
}

function remote(id: string, name: string, avatar = '🦄'): RemoteStudentProfile {
  return {
    id,
    name,
    avatar,
    grade: 'Grade 4',
    createdAt: '2026-02-01T00:00:00.000Z',
  };
}

describe('second-device remote profile import', () => {
  it('keeps same-name students distinct by stable ID', () => {
    const plan = planRemoteProfilesForLocalImport(
      [local('student_alex_1', 'Alex')],
      [remote('student_alex_1', 'Alex'), remote('student_alex_2', 'Alex')],
    );

    expect(plan.alreadyLocal.map((profile) => profile.id)).toEqual(['student_alex_1']);
    expect(plan.importable.map((profile) => profile.id)).toEqual(['student_alex_2']);
    expect(plan.conflicts).toHaveLength(0);
  });

  it('fails closed when an existing stable ID has different profile data', async () => {
    let saveCalls = 0;
    const result = await importRemoteProfilesLocally(
      [local('student_alex_1', 'Alex', '🦄')],
      [remote('student_alex_1', 'Alex', '🚀')],
      { save: async () => { saveCalls += 1; } },
    );

    expect(result.wrote).toBe(false);
    expect(result.conflicts.map((item) => item.studentId)).toEqual(['student_alex_1']);
    expect(result.imported).toHaveLength(0);
    expect(saveCalls).toBe(0);
  });

  it('imports remote-only profiles without rewriting stable IDs', async () => {
    let persisted: StudentProfile[] = [];
    const result = await importRemoteProfilesLocally(
      [local('student_local_1', 'Sam')],
      [remote('student_remote_2', 'Taylor', '🚀')],
      {
        nowIso: '2026-09-06T08:40:00.000Z',
        save: async (profiles) => { persisted = profiles; },
      },
    );

    expect(result.wrote).toBe(true);
    expect(result.imported).toEqual([{
      id: 'student_remote_2',
      name: 'Taylor',
      avatar: '🚀',
      grade: 'Grade 4',
      createdAt: '2026-02-01T00:00:00.000Z',
      lastLoginAt: '2026-09-06T08:40:00.000Z',
    }]);
    expect(persisted.map((profile) => profile.id)).toEqual(['student_local_1', 'student_remote_2']);
  });

  it('does not rewrite storage for an idempotent already-local import', async () => {
    let saveCalls = 0;
    const result = await importRemoteProfilesLocally(
      [local('student_1', 'Alex')],
      [remote('student_1', 'Alex')],
      { save: async () => { saveCalls += 1; } },
    );

    expect(result.wrote).toBe(false);
    expect(result.alreadyLocal).toHaveLength(1);
    expect(saveCalls).toBe(0);
  });
});
