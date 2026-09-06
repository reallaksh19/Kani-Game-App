import { KaniAttemptV1, KaniQuestion } from '../integration/kani/contracts';
import { attemptCredit } from './canonicalRevisionSignals';

export interface RetrySelection {
  questions: KaniQuestion[];
  staleQuestionIds: string[];
  latestCredits: Map<string, number>;
}

interface LatestScoredAttempt {
  attempt: KaniAttemptV1;
  credit: number;
}

function latestScoredByQuestion(attempts: readonly KaniAttemptV1[], pageId?: string): Map<string, LatestScoredAttempt> {
  const latest = new Map<string, LatestScoredAttempt>();
  const ordered = [...attempts].sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt));

  ordered.forEach((attempt) => {
    if (!attempt.questionId) return;
    if (pageId && attempt.pageId !== pageId) return;
    if (latest.has(attempt.questionId)) return;
    const credit = attemptCredit(attempt);
    if (credit === null) return;
    latest.set(attempt.questionId, { attempt, credit });
  });

  return latest;
}

export function selectRetryQuestions(
  questions: readonly KaniQuestion[],
  attempts: readonly KaniAttemptV1[],
  options: { pageId?: string; limit?: number } = {},
): RetrySelection {
  const latest = latestScoredByQuestion(attempts, options.pageId);
  const currentIds = new Set(questions.map((question) => question.id));
  const retryIds = new Set(
    [...latest.entries()]
      .filter(([, entry]) => entry.credit < 1)
      .map(([questionId]) => questionId),
  );
  const limit = Math.max(0, options.limit ?? 10);
  const retryQuestions = questions
    .filter((question) => retryIds.has(question.id))
    .slice(0, limit);
  const staleQuestionIds = [...retryIds]
    .filter((questionId) => !currentIds.has(questionId))
    .sort();

  return {
    questions: retryQuestions,
    staleQuestionIds,
    latestCredits: new Map([...latest.entries()].map(([questionId, entry]) => [questionId, entry.credit])),
  };
}
