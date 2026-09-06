import { describe, expect, it } from 'vitest';
import { KANI_SCHEMA_VERSION, KaniAttemptV1, KaniQuestion } from '../integration/kani/contracts';
import { selectRetryQuestions } from './canonicalRetrySelection';

function question(id: string): KaniQuestion {
  return {
    schemaVersion: KANI_SCHEMA_VERSION,
    id,
    type: 'true_false',
    prompt: id,
    answer: true,
    skillIds: [],
    conceptTags: [],
    curriculumTags: [],
    difficulty: 'medium',
  };
}

function attempt(overrides: Partial<KaniAttemptV1>): KaniAttemptV1 {
  return {
    schemaVersion: KANI_SCHEMA_VERSION,
    attemptId: overrides.attemptId || `a_${Math.random()}`,
    studentId: 'student_1',
    activityId: 'studyhub:page_1',
    activityType: 'lesson',
    sourceApp: 'study-hub',
    pageId: 'page_1',
    questionId: 'q1',
    skillIds: [],
    difficulty: 'medium',
    completedAt: '2026-09-06T06:00:00.000Z',
    ...overrides,
  };
}

describe('selectRetryQuestions', () => {
  it('includes only questions whose latest scored result is below full credit', () => {
    const result = selectRetryQuestions([question('q1'), question('q2'), question('q3')], [
      attempt({ attemptId: 'q1-old', questionId: 'q1', correct: false, completedAt: '2026-09-06T05:00:00.000Z' }),
      attempt({ attemptId: 'q1-new', questionId: 'q1', correct: true, completedAt: '2026-09-06T06:00:00.000Z' }),
      attempt({ attemptId: 'q2-new', questionId: 'q2', partialCredit: 0.5, completedAt: '2026-09-06T06:10:00.000Z' }),
      attempt({ attemptId: 'q3-unscored', questionId: 'q3', completedAt: '2026-09-06T06:20:00.000Z' }),
    ], { pageId: 'page_1' });

    expect(result.questions.map((item) => item.id)).toEqual(['q2']);
    expect(result.latestCredits.get('q1')).toBe(1);
    expect(result.latestCredits.get('q2')).toBe(0.5);
    expect(result.latestCredits.has('q3')).toBe(false);
  });

  it('preserves current authored order and respects the retry limit', () => {
    const result = selectRetryQuestions([question('q3'), question('q1'), question('q2')], [
      attempt({ attemptId: 'q1', questionId: 'q1', correct: false }),
      attempt({ attemptId: 'q2', questionId: 'q2', correct: false }),
      attempt({ attemptId: 'q3', questionId: 'q3', correct: false }),
    ], { pageId: 'page_1', limit: 2 });

    expect(result.questions.map((item) => item.id)).toEqual(['q3', 'q1']);
  });

  it('reports stale unresolved question ids without fabricating content', () => {
    const result = selectRetryQuestions([question('q1')], [
      attempt({ attemptId: 'old-miss', questionId: 'retired_q', correct: false }),
      attempt({ attemptId: 'q1-miss', questionId: 'q1', correct: false }),
    ], { pageId: 'page_1' });

    expect(result.questions.map((item) => item.id)).toEqual(['q1']);
    expect(result.staleQuestionIds).toEqual(['retired_q']);
  });

  it('does not leak attempts from another page into the retry set', () => {
    const result = selectRetryQuestions([question('q1')], [
      attempt({ attemptId: 'other-page', pageId: 'page_2', questionId: 'q1', correct: false }),
    ], { pageId: 'page_1' });

    expect(result.questions).toEqual([]);
  });
});
