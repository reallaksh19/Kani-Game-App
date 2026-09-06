import { KaniAttemptV1 } from '../integration/kani/contracts';
import { attemptCredit, deriveRevisionSignal, RevisionSignalKind } from './canonicalRevisionSignals';

export type EvidenceTrend = 'improving' | 'declining' | 'steady' | 'insufficient';
export type EvidenceConfidence = 'low' | 'medium' | 'high';

export interface CanonicalEvidenceRollup {
  id: string;
  attemptCount: number;
  scoredCount: number;
  recentAverageCredit: number | null;
  previousAverageCredit: number | null;
  trend: EvidenceTrend;
  confidence: EvidenceConfidence;
  revisionSignal: RevisionSignalKind;
  lastAttemptAt: string | null;
}

const TREND_WINDOW = 3;
const TREND_MIN_PER_WINDOW = 2;
const TREND_DELTA = 0.15;

function newestFirst(attempts: readonly KaniAttemptV1[]): KaniAttemptV1[] {
  return [...attempts].sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt));
}

function average(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function confidence(scoredCount: number): EvidenceConfidence {
  if (scoredCount >= 6) return 'high';
  if (scoredCount >= 3) return 'medium';
  return 'low';
}

function trendForCredits(credits: readonly number[]): {
  recentAverageCredit: number | null;
  previousAverageCredit: number | null;
  trend: EvidenceTrend;
} {
  const recent = credits.slice(0, TREND_WINDOW);
  const previous = credits.slice(TREND_WINDOW, TREND_WINDOW * 2);
  const recentAverageCredit = average(recent);
  const previousAverageCredit = average(previous);

  if (recent.length < TREND_MIN_PER_WINDOW || previous.length < TREND_MIN_PER_WINDOW || recentAverageCredit === null || previousAverageCredit === null) {
    return { recentAverageCredit, previousAverageCredit, trend: 'insufficient' };
  }

  const delta = recentAverageCredit - previousAverageCredit;
  return {
    recentAverageCredit,
    previousAverageCredit,
    trend: delta >= TREND_DELTA ? 'improving' : delta <= -TREND_DELTA ? 'declining' : 'steady',
  };
}

export function deriveEvidenceRollup(id: string, attempts: readonly KaniAttemptV1[]): CanonicalEvidenceRollup {
  const ordered = newestFirst(attempts);
  const credits = ordered
    .map(attemptCredit)
    .filter((value): value is number => value !== null);
  const revision = deriveRevisionSignal(ordered);
  const trend = trendForCredits(credits);

  return {
    id,
    attemptCount: ordered.length,
    scoredCount: credits.length,
    recentAverageCredit: trend.recentAverageCredit,
    previousAverageCredit: trend.previousAverageCredit,
    trend: trend.trend,
    confidence: confidence(credits.length),
    revisionSignal: revision.kind,
    lastAttemptAt: ordered[0]?.completedAt ?? null,
  };
}

function deriveGroupedRollups(grouped: Map<string, KaniAttemptV1[]>): Map<string, CanonicalEvidenceRollup> {
  return new Map([...grouped.entries()].map(([id, attempts]) => [id, deriveEvidenceRollup(id, attempts)]));
}

export function deriveTopicEvidenceRollups(attempts: readonly KaniAttemptV1[]): Map<string, CanonicalEvidenceRollup> {
  const grouped = new Map<string, KaniAttemptV1[]>();
  attempts.forEach((attempt) => {
    if (!attempt.topicId) return;
    const current = grouped.get(attempt.topicId) || [];
    current.push(attempt);
    grouped.set(attempt.topicId, current);
  });
  return deriveGroupedRollups(grouped);
}

export function deriveSkillEvidenceRollups(attempts: readonly KaniAttemptV1[]): Map<string, CanonicalEvidenceRollup> {
  const grouped = new Map<string, KaniAttemptV1[]>();
  attempts.forEach((attempt) => {
    [...new Set(attempt.skillIds)].forEach((skillId) => {
      if (!skillId.trim()) return;
      const current = grouped.get(skillId) || [];
      current.push(attempt);
      grouped.set(skillId, current);
    });
  });
  return deriveGroupedRollups(grouped);
}

export function getPracticeFocusRollups(
  rollups: ReadonlyMap<string, CanonicalEvidenceRollup>,
  limit = 3,
): CanonicalEvidenceRollup[] {
  return [...rollups.values()]
    .filter((rollup) => rollup.revisionSignal === 'needs_practice')
    .sort((a, b) => {
      const averageA = a.recentAverageCredit ?? 1;
      const averageB = b.recentAverageCredit ?? 1;
      if (averageA !== averageB) return averageA - averageB;
      if (a.scoredCount !== b.scoredCount) return b.scoredCount - a.scoredCount;
      return a.id.localeCompare(b.id);
    })
    .slice(0, Math.max(0, limit));
}

export function getStrongEvidenceRollups(
  rollups: ReadonlyMap<string, CanonicalEvidenceRollup>,
  limit = 3,
): CanonicalEvidenceRollup[] {
  return [...rollups.values()]
    .filter((rollup) => rollup.revisionSignal === 'strong_recent_evidence')
    .sort((a, b) => {
      const averageA = a.recentAverageCredit ?? -1;
      const averageB = b.recentAverageCredit ?? -1;
      if (averageA !== averageB) return averageB - averageA;
      if (a.scoredCount !== b.scoredCount) return b.scoredCount - a.scoredCount;
      return a.id.localeCompare(b.id);
    })
    .slice(0, Math.max(0, limit));
}
