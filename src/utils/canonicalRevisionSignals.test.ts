import { describe, expect, it } from 'vitest';
import { KANI_SCHEMA_VERSION, KaniAttemptV1 } from '../integration/kani/contracts';
import {
  attemptCredit,
  derivePageRevisionSignals,
  deriveRevisionSignal,
  getSuggestedReviewPages,
} from './canonicalRevisionSignals';

function attempt(overrides: Partial<KaniAttemptV1> = {}): KaniAttemptV1 {
  return {
    schemaVersion: KANI_SCHEMA_VERSION,
    attemptId: overrides.attemptId || `attempt_${Math.random()}`,
    studentId: 'student_1',
    activityId: 'studyhub:page_1',
    activityType: 'lesson',
    sourceApp: 'study-hub',
    pageId: 'page_1',
    skillIds: [],
    difficulty: 'medium',
    completedAt: '2026-09-06T05:00:00.000Z',
    ...overrides,
  };
}

describe('canonical revision signals', () => {
  it('uses explicit partial credit before boolean correctness', () => {
    expect(attemptCredit(attempt({ partialCredit: 0.4, correct: true }))).toBe(0.4);
    expect(attemptCredit(attempt({ correct: false }))).toBe(0);
    expect(attemptCredit(attempt())).toBeNull();
  });

  it('keeps unscored evidence out of recent credit calculations', () => {
    const signal = deriveRevisionSignal([
      attempt({ attemptId: 'unscored', completedAt: '2026-09-06T05:05:00.000Z' }),
      attempt({ attemptId: 'correct', correct: true, completedAt: '2026-09-06T05:04:00.000Z' }),
      attempt({ attemptId: 'wrong', correct: false, completedAt: '2026-09-06T05:03:00.000Z' }),
    ]);

    expect(signal.attemptCount).toBe(3);
    expect(signal.scoredCount).toBe(2);
    expect(signal.recentAverageCredit).toBe(0.5);
    expect(signal.kind).toBe('needs_practice');
  });

  it('requires enough clean recent evidence before calling it strong', () => {
    expect(deriveRevisionSignal([
      attempt({ attemptId: '1', correct: true, completedAt: '2026-09-06T05:03:00.000Z' }),
      attempt({ attemptId: '2', correct: true, completedAt: '2026-09-06T05:02:00.000Z' }),
    ]).kind).toBe('building_evidence');

    expect(deriveRevisionSignal([
      attempt({ attemptId: '1', correct: true, completedAt: '2026-09-06T05:03:00.000Z' }),
      attempt({ attemptId: '2', correct: true, completedAt: '2026-09-06T05:02:00.000Z' }),
      attempt({ attemptId: '3', correct: true, completedAt: '2026-09-06T05:01:00.000Z' }),
    ]).kind).toBe('strong_recent_evidence');
  });

  it('lets a new miss re-open a practice signal after earlier success', () => {
    const signal = deriveRevisionSignal([
      attempt({ attemptId: 'miss', correct: false, completedAt: '2026-09-06T05:04:00.000Z' }),
      attempt({ attemptId: '1', correct: true, completedAt: '2026-09-06T05:03:00.000Z' }),
      attempt({ attemptId: '2', correct: true, completedAt: '2026-09-06T05:02:00.000Z' }),
      attempt({ attemptId: '3', correct: true, completedAt: '2026-09-06T05:01:00.000Z' }),
    ]);

    expect(signal.kind).toBe('needs_practice');
    expect(signal.latestCredit).toBe(0);
  });

  it('groups only page-addressable evidence and recommends available pages deterministically', () => {
    const signals = derivePageRevisionSignals([
      attempt({ attemptId: 'p1', pageId: 'page_1', correct: false, completedAt: '2026-09-06T05:05:00.000Z' }),
      attempt({ attemptId: 'p2', pageId: 'page_2', partialCredit: 0.5, completedAt: '2026-09-06T05:06:00.000Z' }),
      attempt({ attemptId: 'p3', pageId: 'page_3', correct: true, completedAt: '2026-09-06T05:07:00.000Z' }),
      attempt({ attemptId: 'no-page', pageId: undefined, correct: false }),
    ]);

    expect(signals.has('page_1')).toBe(true);
    expect(signals.has('page_2')).toBe(true);
    expect(signals.has('page_3')).toBe(true);
    expect(signals.size).toBe(3);

    const suggested = getSuggestedReviewPages(signals, ['page_1', 'page_2', 'page_3'], 2);
    expect(suggested.map((item) => item.pageId)).toEqual(['page_1', 'page_2']);
  });
});
