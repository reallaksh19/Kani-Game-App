import { describe, expect, it } from 'vitest';
import { KaniAttemptV1 } from './contracts';
import {
  deriveStudentRecommendationsPayload,
  deriveStudentRevisionPayload,
} from './evidenceDerivations';
import { StaticGuardianSessionProvider } from './GuardianSessionProvider';
import { LearnerApiClient } from './LearnerApiClient';
import { derivePageRevisionSignals } from '../../utils/canonicalRevisionSignals';
import {
  deriveSkillEvidenceRollups,
  deriveTopicEvidenceRollups,
} from '../../utils/canonicalEvidenceRollups';

function attempt(
  attemptId: string,
  completedAt: string,
  overrides: Partial<KaniAttemptV1> = {},
): KaniAttemptV1 {
  return {
    schemaVersion: '1.0',
    attemptId,
    studentId: 'student_a',
    activityId: 'studyhub:number-system',
    activityType: 'worksheet',
    sourceApp: 'study-hub',
    subjectId: 'grade4math',
    topicId: 'number-system',
    pageId: 'number-system-practice',
    questionId: `q-${attemptId}`,
    skillIds: ['place-value'],
    difficulty: 'medium',
    correct: false,
    partialCredit: 0,
    completedAt,
    ...overrides,
  };
}

const evidence = [
  attempt('a1', '2026-09-06T06:00:00.000Z', { partialCredit: 1, correct: true }),
  attempt('a2', '2026-09-06T06:05:00.000Z', { partialCredit: 0, correct: false }),
  attempt('a3', '2026-09-06T06:10:00.000Z', { partialCredit: 0.5, correct: false }),
  attempt('a4', '2026-09-06T06:15:00.000Z', { partialCredit: 0, correct: false }),
  attempt('b1', '2026-09-06T06:20:00.000Z', {
    topicId: 'fractions',
    pageId: 'fractions-practice',
    skillIds: ['compare-fractions'],
    partialCredit: 1,
    correct: true,
  }),
  attempt('b2', '2026-09-06T06:25:00.000Z', {
    topicId: 'fractions',
    pageId: 'fractions-practice',
    skillIds: ['compare-fractions'],
    partialCredit: 1,
    correct: true,
  }),
  attempt('b3', '2026-09-06T06:30:00.000Z', {
    topicId: 'fractions',
    pageId: 'fractions-practice',
    skillIds: ['compare-fractions'],
    partialCredit: 1,
    correct: true,
  }),
];

describe('remote evidence derivations', () => {
  it('uses exactly the same page/topic/skill derivations as local Kani utilities', () => {
    const remote = deriveStudentRevisionPayload('student_a', evidence);
    expect(remote.pages).toEqual([...derivePageRevisionSignals(evidence).values()].sort((a, b) => a.pageId.localeCompare(b.pageId)));
    expect(remote.topics).toEqual([...deriveTopicEvidenceRollups(evidence).values()].sort((a, b) => a.id.localeCompare(b.id)));
    expect(remote.skills).toEqual([...deriveSkillEvidenceRollups(evidence).values()].sort((a, b) => a.id.localeCompare(b.id)));
  });

  it('returns explainable recommendations rather than an opaque mastery score', () => {
    const result = deriveStudentRecommendationsPayload('student_a', evidence);
    expect(result.schemaVersion).toBe('1.0');
    expect(result.evidenceAttemptCount).toBe(evidence.length);
    expect(result.recommendations.some((item) => item.targetKind === 'page' && item.targetId === 'number-system-practice')).toBe(true);
    expect(result.recommendations.some((item) => item.targetKind === 'topic' && item.targetId === 'number-system')).toBe(true);
    expect(result.recommendations.every((item) => item.evidenceCount >= item.scoredCount)).toBe(true);
    expect(result.recommendations.every((item) => ['needs_practice', 'declining_evidence', 'building_evidence'].includes(item.reasonCode))).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(/mastery/i);
  });

  it('isolates evidence by stable studentId', () => {
    const other = attempt('other-1', '2026-09-06T07:00:00.000Z', { studentId: 'student_b', partialCredit: 0, correct: false });
    const result = deriveStudentRevisionPayload('student_a', [...evidence, other]);
    expect(result.evidenceAttemptCount).toBe(evidence.length);
  });
});

describe('LearnerApiClient evidence endpoints', () => {
  it('requests revision and recommendations through authenticated student routes', async () => {
    const paths: string[] = [];
    const fetchImpl: typeof fetch = async (input) => {
      paths.push(String(input));
      return new Response(JSON.stringify({
        schemaVersion: '1.0',
        studentId: 'student one',
        evidenceAttemptCount: 0,
        pages: [],
        topics: [],
        skills: [],
        recommendations: [],
        evidenceWindow: { maxAttempts: 1000, truncated: false },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };
    const client = new LearnerApiClient({
      baseUrl: 'https://project.supabase.co/functions/v1/kani-api/api/v1',
      sessionProvider: new StaticGuardianSessionProvider({ userId: 'guardian-1', accessToken: 'jwt' }),
      publishableKey: 'sb_publishable_example',
      fetchImpl,
    });

    await client.getRevision('student one');
    await client.getRecommendations('student one');
    expect(paths[0]).toEndWith('/students/student%20one/revision');
    expect(paths[1]).toEndWith('/students/student%20one/recommendations');
  });
});
