import { describe, expect, it } from 'vitest';
import { KaniAttemptV1 } from '../integration/kani/contracts';
import { canonicalAttemptCredit, getCanonicalAttemptSummary, getRecentCanonicalAttempts } from './canonicalAttemptAnalytics';

const attempts: KaniAttemptV1[] = [
  {
    schemaVersion: '1.0',
    attemptId: 'a1',
    studentId: 'student-1',
    activityId: 'studyhub:fractions',
    activityType: 'lesson',
    sourceApp: 'study-hub',
    questionId: 'q1',
    skillIds: ['fractions'],
    difficulty: 'easy',
    correct: true,
    partialCredit: 1,
    responseTimeMs: 2000,
    completedAt: '2026-09-06T01:00:00.000Z',
  },
  {
    schemaVersion: '1.0',
    attemptId: 'a2',
    studentId: 'student-1',
    activityId: 'studyhub:fractions',
    activityType: 'lesson',
    sourceApp: 'study-hub',
    questionId: 'q2',
    skillIds: ['fractions'],
    difficulty: 'medium',
    correct: false,
    partialCredit: 0,
    responseTimeMs: 3000,
    completedAt: '2026-09-06T01:01:00.000Z',
  },
  {
    schemaVersion: '1.0',
    attemptId: 'a3',
    studentId: 'student-1',
    activityId: 'worksheet:geometry',
    activityType: 'worksheet',
    sourceApp: 'worksheet-app',
    skillIds: ['geometry'],
    difficulty: 'medium',
    partialCredit: 0.5,
    responseTimeMs: 5000,
    completedAt: '2026-09-06T02:00:00.000Z',
  },
  {
    schemaVersion: '1.0',
    attemptId: 'a4',
    studentId: 'student-1',
    activityId: 'external:logic',
    activityType: 'interactive',
    sourceApp: 'game-app',
    skillIds: ['logic'],
    difficulty: 'hard',
    score: 80,
    completedAt: '2026-09-06T03:00:00.000Z',
  },
];

describe('canonicalAttemptAnalytics', () => {
  it('uses partial credit first and falls back to boolean correctness', () => {
    expect(canonicalAttemptCredit(attempts[0])).toBe(1);
    expect(canonicalAttemptCredit({ ...attempts[1], partialCredit: undefined, correct: false })).toBe(0);
    expect(canonicalAttemptCredit(attempts[3])).toBeNull();
  });

  it('summarizes records without pretending unscored evidence is mastery', () => {
    expect(getCanonicalAttemptSummary(attempts)).toEqual({
      records: 4,
      activities: 3,
      scoredRecords: 3,
      correctRecords: 1,
      averageCredit: 0.5,
      totalResponseTimeMs: 10000,
      latestCompletedAt: '2026-09-06T03:00:00.000Z',
      sources: [
        { sourceApp: 'study-hub', count: 2 },
        { sourceApp: 'game-app', count: 1 },
        { sourceApp: 'worksheet-app', count: 1 },
      ],
    });
  });

  it('returns recent evidence in newest-first order without mutating source data', () => {
    const before = attempts.map((attempt) => attempt.attemptId);
    expect(getRecentCanonicalAttempts(attempts, 2).map((attempt) => attempt.attemptId)).toEqual(['a4', 'a3']);
    expect(attempts.map((attempt) => attempt.attemptId)).toEqual(before);
  });
});
