import { KaniAttemptV1, KaniSourceApp } from '../integration/kani/contracts';

export interface CanonicalAttemptSourceSummary {
  sourceApp: KaniSourceApp;
  count: number;
}

export interface CanonicalAttemptSummary {
  records: number;
  activities: number;
  scoredRecords: number;
  correctRecords: number;
  averageCredit: number | null;
  totalResponseTimeMs: number;
  latestCompletedAt: string | null;
  sources: CanonicalAttemptSourceSummary[];
}

export function canonicalAttemptCredit(attempt: KaniAttemptV1): number | null {
  if (typeof attempt.partialCredit === 'number' && Number.isFinite(attempt.partialCredit)) {
    return Math.max(0, Math.min(1, attempt.partialCredit));
  }
  if (typeof attempt.correct === 'boolean') return attempt.correct ? 1 : 0;
  return null;
}

export function getCanonicalAttemptSummary(attempts: readonly KaniAttemptV1[]): CanonicalAttemptSummary {
  const credits = attempts
    .map(canonicalAttemptCredit)
    .filter((value): value is number => value !== null);
  const sourceCounts = new Map<KaniSourceApp, number>();
  attempts.forEach((attempt) => sourceCounts.set(attempt.sourceApp, (sourceCounts.get(attempt.sourceApp) || 0) + 1));

  const latestCompletedAt = attempts.reduce<string | null>((latest, attempt) => {
    if (!latest) return attempt.completedAt;
    return Date.parse(attempt.completedAt) > Date.parse(latest) ? attempt.completedAt : latest;
  }, null);

  return {
    records: attempts.length,
    activities: new Set(attempts.map((attempt) => attempt.activityId)).size,
    scoredRecords: credits.length,
    correctRecords: attempts.filter((attempt) => attempt.correct === true).length,
    averageCredit: credits.length === 0 ? null : credits.reduce((sum, value) => sum + value, 0) / credits.length,
    totalResponseTimeMs: attempts.reduce((sum, attempt) => sum + (attempt.responseTimeMs || 0), 0),
    latestCompletedAt,
    sources: [...sourceCounts.entries()]
      .map(([sourceApp, count]) => ({ sourceApp, count }))
      .sort((a, b) => b.count - a.count || a.sourceApp.localeCompare(b.sourceApp)),
  };
}

export function getRecentCanonicalAttempts(attempts: readonly KaniAttemptV1[], limit = 8): KaniAttemptV1[] {
  return [...attempts]
    .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))
    .slice(0, Math.max(0, Math.floor(limit)));
}
