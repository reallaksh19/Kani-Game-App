import { describe, expect, it, vi } from 'vitest';
import {
  acceptKaniActivityEvent,
  completionMessageToAttempt,
  createLaunchMessage,
  normalizeAllowedOrigins,
  parseKaniActivityMessage,
  postKaniActivityMessage,
} from './activityBridge';

const launch = createLaunchMessage({
  launchId: 'launch_1',
  activityId: 'activity_1',
  studentId: 'student_1',
  activityType: 'game',
  skillIds: ['skill_1'],
  difficulty: 'medium',
});

const completed = {
  schemaVersion: '1.0',
  type: 'kani.activity.completed',
  launchId: 'launch_1',
  activityId: 'activity_1',
  payload: {
    studentId: 'student_1',
    attemptId: 'attempt_1',
    activityType: 'game',
    correct: 8,
    total: 10,
    accuracy: 0.8,
    score: 82,
    durationSeconds: 100,
    difficulty: 'medium',
    skillIds: ['skill_1'],
    completedAt: '2026-09-05T14:00:00.000Z',
  },
};

describe('Kani activity bridge', () => {
  it('creates a launch contract without wildcard transport assumptions', () => {
    expect(launch.type).toBe('kani.activity.launch');
    if (launch.type !== 'kani.activity.launch') throw new Error('Expected launch message');
    expect(launch.payload.studentId).toBe('student_1');
  });

  it('normalizes configured origins and ignores invalid values', () => {
    expect(normalizeAllowedOrigins(['https://study.example/path', 'bad', 'https://study.example'])).toEqual(['https://study.example']);
  });

  it('accepts only matching origin/source/launch/activity/student context', () => {
    const source = {} as MessageEventSource;
    expect(acceptKaniActivityEvent({
      event: { origin: 'https://study.example', source, data: completed },
      allowedOrigins: ['https://study.example'],
      expectedSource: source,
      launchId: 'launch_1',
      activityId: 'activity_1',
      studentId: 'student_1',
    })).toMatchObject({ accepted: true });

    expect(acceptKaniActivityEvent({
      event: { origin: 'https://evil.example', source, data: completed },
      allowedOrigins: ['https://study.example'],
      expectedSource: source,
      launchId: 'launch_1',
      activityId: 'activity_1',
    })).toEqual({ accepted: false, reason: 'origin_not_allowed' });

    expect(acceptKaniActivityEvent({
      event: { origin: 'https://study.example', source, data: { ...completed, launchId: 'wrong' } },
      allowedOrigins: ['https://study.example'],
      expectedSource: source,
      launchId: 'launch_1',
      activityId: 'activity_1',
    })).toEqual({ accepted: false, reason: 'launch_mismatch' });

    expect(acceptKaniActivityEvent({
      event: { origin: 'https://study.example', source, data: { ...completed, activityId: 'wrong' } },
      allowedOrigins: ['https://study.example'],
      expectedSource: source,
      launchId: 'launch_1',
      activityId: 'activity_1',
    })).toEqual({ accepted: false, reason: 'activity_mismatch' });

    expect(acceptKaniActivityEvent({
      event: { origin: 'https://study.example', source, data: { ...completed, payload: { ...completed.payload, studentId: 'student_2' } } },
      allowedOrigins: ['https://study.example'],
      expectedSource: source,
      launchId: 'launch_1',
      activityId: 'activity_1',
      studentId: 'student_1',
    })).toEqual({ accepted: false, reason: 'student_mismatch' });
  });

  it('rejects malformed or unsafe completion summaries', () => {
    expect(parseKaniActivityMessage({ ...completed, schemaVersion: '2.0' })).toBeNull();
    expect(parseKaniActivityMessage({ ...completed, payload: { ...completed.payload, accuracy: 2 } })).toBeNull();
    expect(parseKaniActivityMessage({ ...completed, payload: { ...completed.payload, correct: -1 } })).toBeNull();
    expect(parseKaniActivityMessage({ ...completed, payload: { ...completed.payload, total: 2.5 } })).toBeNull();
    expect(parseKaniActivityMessage({ ...completed, payload: { ...completed.payload, correct: 11, total: 10 } })).toBeNull();
    expect(parseKaniActivityMessage({ ...completed, payload: { ...completed.payload, durationSeconds: -1 } })).toBeNull();
    expect(parseKaniActivityMessage({ nope: true })).toBeNull();
  });

  it('requires explicit target origin when posting', () => {
    const postMessage = vi.fn();
    postKaniActivityMessage({ postMessage } as unknown as Window, 'https://study.example/path', launch);
    expect(postMessage).toHaveBeenCalledWith(launch, 'https://study.example');
    expect(() => postKaniActivityMessage({ postMessage } as unknown as Window, '*', launch)).toThrow(/targetOrigin/);
  });

  it('normalizes an accepted completion into a canonical attempt without inventing per-question correctness', () => {
    const parsed = parseKaniActivityMessage(completed);
    if (!parsed) throw new Error('Expected valid completion');
    const attempt = completionMessageToAttempt(parsed, {
      sourceApp: 'study-hub',
      subjectId: 'mathematics',
      topicId: 'fractions',
      pageId: 'fractions-page',
    });

    expect(attempt).toEqual({
      schemaVersion: '1.0',
      attemptId: 'attempt_1',
      studentId: 'student_1',
      activityId: 'activity_1',
      activityType: 'game',
      sourceApp: 'study-hub',
      subjectId: 'mathematics',
      topicId: 'fractions',
      pageId: 'fractions-page',
      skillIds: ['skill_1'],
      difficulty: 'medium',
      partialCredit: 0.8,
      responseTimeMs: 100000,
      score: 82,
      completedAt: '2026-09-05T14:00:00.000Z',
    });
    expect(attempt.correct).toBeUndefined();
  });

  it('maps correctness only for a single-outcome completion', () => {
    const parsed = parseKaniActivityMessage({
      ...completed,
      payload: { ...completed.payload, correct: 1, total: 1, accuracy: 1 },
    });
    if (!parsed) throw new Error('Expected valid completion');
    expect(completionMessageToAttempt(parsed, { sourceApp: 'study-hub' })).toMatchObject({
      correct: true,
      partialCredit: 1,
    });
  });
});
