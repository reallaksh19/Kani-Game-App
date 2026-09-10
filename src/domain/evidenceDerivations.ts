import { KaniAttemptV1 } from './contracts.ts';

export type RevisionSignalKind = 'needs_practice' | 'building_evidence' | 'strong_recent_evidence';
export type EvidenceTrend = 'improving' | 'declining' | 'steady' | 'insufficient';
export type EvidenceConfidence = 'low' | 'medium' | 'high';

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

export type EvidenceTargetKind = 'page' | 'topic' | 'skill';
export type EvidenceRecommendationReason = 'needs_practice' | 'declining_evidence' | 'building_evidence';

export interface EvidenceRecommendation {
  targetKind: EvidenceTargetKind;
  targetId: string;
  reasonCode: EvidenceRecommendationReason;
  evidenceCount: number;
  scoredCount: number;
  confidence: EvidenceConfidence;
  recentAverageCredit: number | null;
  trend: EvidenceTrend | 'not_applicable';
  lastAttemptAt: string | null;
}

export interface StudentRevisionPayload {
  schemaVersion: '1.0';
  studentId: string;
  evidenceAttemptCount: number;
  pages: PageRevisionSignal[];
  topics: CanonicalEvidenceRollup[];
  skills: CanonicalEvidenceRollup[];
}

export interface StudentRecommendationsPayload {
  schemaVersion: '1.0';
  studentId: string;
  evidenceAttemptCount: number;
  recommendations: EvidenceRecommendation[];
}

const RECENT_WINDOW = 5;
const STRONG_MIN_SCORED = 3;
const STRONG_THRESHOLD = 0.85;
const NEEDS_PRACTICE_THRESHOLD = 0.7;
const LOW_CREDIT_THRESHOLD = 0.999;
const TREND_WINDOW = 3;
const TREND_MIN_PER_WINDOW = 2;
const TREND_DELTA = 0.15;

function newestFirst(attempts: readonly KaniAttemptV1[]): KaniAttemptV1[] {
  return [...attempts].sort((a, b) => {
    const completed = Date.parse(b.completedAt) - Date.parse(a.completedAt);
    return completed !== 0 ? completed : b.attemptId.localeCompare(a.attemptId);
  });
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

export function attemptCredit(attempt: KaniAttemptV1): number | null {
  if (typeof attempt.partialCredit === 'number' && Number.isFinite(attempt.partialCredit)) {
    return Math.max(0, Math.min(1, attempt.partialCredit));
  }
  if (typeof attempt.correct === 'boolean') return attempt.correct ? 1 : 0;
  return null;
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
  if (
    recentAverageCredit !== null
    && ((latestCredit !== null && latestCredit < LOW_CREDIT_THRESHOLD) || recentAverageCredit < NEEDS_PRACTICE_THRESHOLD)
  ) {
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
  return new Map([...grouped.entries()].map(([pageId, pageAttempts]) => [pageId, { pageId, ...deriveRevisionSignal(pageAttempts) }]));
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
  const credits = ordered.map(attemptCredit).filter((value): value is number => value !== null);
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

export function getPracticeFocusRollups(rollups: ReadonlyMap<string, CanonicalEvidenceRollup>, limit = 3): CanonicalEvidenceRollup[] {
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

export function getStrongEvidenceRollups(rollups: ReadonlyMap<string, CanonicalEvidenceRollup>, limit = 3): CanonicalEvidenceRollup[] {
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

function recommendationFromPage(signal: PageRevisionSignal): EvidenceRecommendation {
  return {
    targetKind: 'page',
    targetId: signal.pageId,
    reasonCode: signal.kind === 'needs_practice' ? 'needs_practice' : 'building_evidence',
    evidenceCount: signal.attemptCount,
    scoredCount: signal.scoredCount,
    confidence: confidence(signal.scoredCount),
    recentAverageCredit: signal.recentAverageCredit,
    trend: 'not_applicable',
    lastAttemptAt: signal.lastAttemptAt,
  };
}

function recommendationFromRollup(targetKind: 'topic' | 'skill', rollup: CanonicalEvidenceRollup): EvidenceRecommendation {
  return {
    targetKind,
    targetId: rollup.id,
    reasonCode: rollup.trend === 'declining' ? 'declining_evidence' : rollup.revisionSignal === 'needs_practice' ? 'needs_practice' : 'building_evidence',
    evidenceCount: rollup.attemptCount,
    scoredCount: rollup.scoredCount,
    confidence: rollup.confidence,
    recentAverageCredit: rollup.recentAverageCredit,
    trend: rollup.trend,
    lastAttemptAt: rollup.lastAttemptAt,
  };
}

export function deriveStudentRevisionPayload(studentId: string, attempts: readonly KaniAttemptV1[]): StudentRevisionPayload {
  const studentAttempts = attempts.filter((attempt) => attempt.studentId === studentId);
  return {
    schemaVersion: '1.0',
    studentId,
    evidenceAttemptCount: studentAttempts.length,
    pages: [...derivePageRevisionSignals(studentAttempts).values()].sort((a, b) => a.pageId.localeCompare(b.pageId)),
    topics: [...deriveTopicEvidenceRollups(studentAttempts).values()].sort((a, b) => a.id.localeCompare(b.id)),
    skills: [...deriveSkillEvidenceRollups(studentAttempts).values()].sort((a, b) => a.id.localeCompare(b.id)),
  };
}

export function deriveStudentRecommendationsPayload(
  studentId: string,
  attempts: readonly KaniAttemptV1[],
  limit = 9,
): StudentRecommendationsPayload {
  const revision = deriveStudentRevisionPayload(studentId, attempts);
  const pageSignals = new Map(revision.pages.map((item) => [item.pageId, item]));
  const topicRollups = new Map(revision.topics.map((item) => [item.id, item]));
  const skillRollups = new Map(revision.skills.map((item) => [item.id, item]));
  const reviewPages = getSuggestedReviewPages(pageSignals, revision.pages.map((item) => item.pageId), 3).map(recommendationFromPage);
  const focusTopics = getPracticeFocusRollups(topicRollups, 3).map((rollup) => recommendationFromRollup('topic', rollup));
  const focusSkills = getPracticeFocusRollups(skillRollups, 3).map((rollup) => recommendationFromRollup('skill', rollup));
  const decliningTopics = revision.topics
    .filter((rollup) => rollup.trend === 'declining' && rollup.revisionSignal !== 'needs_practice')
    .slice(0, 2)
    .map((rollup) => recommendationFromRollup('topic', rollup));
  const decliningSkills = revision.skills
    .filter((rollup) => rollup.trend === 'declining' && rollup.revisionSignal !== 'needs_practice')
    .slice(0, 2)
    .map((rollup) => recommendationFromRollup('skill', rollup));

  const seen = new Set<string>();
  const recommendations = [...reviewPages, ...focusTopics, ...focusSkills, ...decliningTopics, ...decliningSkills]
    .filter((item) => {
      const key = `${item.targetKind}:${item.targetId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, Math.max(0, limit));

  return {
    schemaVersion: '1.0',
    studentId,
    evidenceAttemptCount: revision.evidenceAttemptCount,
    recommendations,
  };
}
