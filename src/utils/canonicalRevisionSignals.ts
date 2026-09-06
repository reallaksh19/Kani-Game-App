import { KaniAttemptV1 } from '../integration/kani/contracts';

export type RevisionSignalKind = 'needs_practice' | 'building_evidence' | 'strong_recent_evidence';

export interface RevisionSignal {
  kind: RevisionSignalKind;
  attemptCount: number;
  scoredCount: number;
  recentAverageCredit: number | null;
  latestCredit: number | null;
  lowCreditCount: number;
  lastAttemptAt: string | null;
}

export interface PageRevisionSignal extends RevisionSignal {
  pageId: string;
}

const RECENT_WINDOW = 5;
const STRONG_MIN_SCORED = 3;
const STRONG_THRESHOLD = 0.85;
const NEEDS_PRACTICE_THRESHOLD = 0.7;
const LOW_CREDIT_THRESHOLD = 0.999;

export function attemptCredit(attempt: KaniAttemptV1): number | null {
  if (typeof attempt.partialCredit === 'number' && Number.isFinite(attempt.partialCredit)) {
    return Math.max(0, Math.min(1, attempt.partialCredit));
  }
  if (typeof attempt.correct === 'boolean') return attempt.correct ? 1 : 0;
  return null;
}

function newestFirst(attempts: readonly KaniAttemptV1[]): KaniAttemptV1[] {
  return [...attempts].sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt));
}

export function deriveRevisionSignal(attempts: readonly KaniAttemptV1[]): RevisionSignal {
  const ordered = newestFirst(attempts);
  const scored = ordered
    .map((attempt) => ({ attempt, credit: attemptCredit(attempt) }))
    .filter((entry): entry is { attempt: KaniAttemptV1; credit: number } => entry.credit !== null);
  const recent = scored.slice(0, RECENT_WINDOW);
  const recentAverageCredit = recent.length > 0
    ? recent.reduce((sum, entry) => sum + entry.credit, 0) / recent.length
    : null;
  const latestCredit = scored[0]?.credit ?? null;
  const lowCreditCount = recent.filter((entry) => entry.credit < LOW_CREDIT_THRESHOLD).length;

  let kind: RevisionSignalKind = 'building_evidence';
  if (recentAverageCredit !== null && (latestCredit !== null && latestCredit < LOW_CREDIT_THRESHOLD || recentAverageCredit < NEEDS_PRACTICE_THRESHOLD)) {
    kind = 'needs_practice';
  } else if (
    scored.length >= STRONG_MIN_SCORED
    && recentAverageCredit !== null
    && recentAverageCredit >= STRONG_THRESHOLD
    && recent.slice(0, STRONG_MIN_SCORED).every((entry) => entry.credit >= LOW_CREDIT_THRESHOLD)
  ) {
    kind = 'strong_recent_evidence';
  }

  return {
    kind,
    attemptCount: ordered.length,
    scoredCount: scored.length,
    recentAverageCredit,
    latestCredit,
    lowCreditCount,
    lastAttemptAt: ordered[0]?.completedAt ?? null,
  };
}

export function derivePageRevisionSignals(attempts: readonly KaniAttemptV1[]): Map<string, PageRevisionSignal> {
  const grouped = new Map<string, KaniAttemptV1[]>();
  attempts.forEach((attempt) => {
    if (!attempt.pageId) return;
    const current = grouped.get(attempt.pageId) || [];
    current.push(attempt);
    grouped.set(attempt.pageId, current);
  });

  return new Map([...grouped.entries()].map(([pageId, pageAttempts]) => [
    pageId,
    { pageId, ...deriveRevisionSignal(pageAttempts) },
  ]));
}

export function getSuggestedReviewPages(
  pageSignals: ReadonlyMap<string, PageRevisionSignal>,
  availablePageIds: readonly string[],
  limit = 3,
): PageRevisionSignal[] {
  const available = new Set(availablePageIds);
  return [...pageSignals.values()]
    .filter((signal) => available.has(signal.pageId) && signal.kind === 'needs_practice')
    .sort((a, b) => {
      const latestA = a.latestCredit ?? 1;
      const latestB = b.latestCredit ?? 1;
      if (latestA !== latestB) return latestA - latestB;
      const averageA = a.recentAverageCredit ?? 1;
      const averageB = b.recentAverageCredit ?? 1;
      if (averageA !== averageB) return averageA - averageB;
      return Date.parse(b.lastAttemptAt || '1970-01-01') - Date.parse(a.lastAttemptAt || '1970-01-01');
    })
    .slice(0, Math.max(0, limit));
}

export function revisionSignalLabel(signal: RevisionSignal): string {
  if (signal.kind === 'needs_practice') return 'Needs practice';
  if (signal.kind === 'strong_recent_evidence') return 'Strong recent evidence';
  return signal.scoredCount === 0 ? 'No scored evidence yet' : 'Building evidence';
}
