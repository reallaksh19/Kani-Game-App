import { describe, expect, it } from 'vitest';
import { KANI_SCHEMA_VERSION, KaniAttemptV1 } from '../integration/kani/contracts';
import {
  deriveEvidenceRollup,
  deriveSkillEvidenceRollups,
  deriveTopicEvidenceRollups,
  getPracticeFocusRollups,
  getStrongEvidenceRollups,
} from './canonicalEvidenceRollups';

function attempt(overrides: Partial<KaniAttemptV1>): KaniAttemptV1 {
  return {
    schemaVersion: KANI_SCHEMA_VERSION,
    attemptId: overrides.attemptId || `a_${Math.random()}`,
    studentId: 'student_1',
    activityId: 'studyhub:page_1',
    activityType: 'lesson',
    sourceApp: 'study-hub',
    topicId: 'topic_1',
    pageId: 'page_1',
    questionId: 'q1',
    skillIds: ['skill_1'],
    difficulty: 'medium',
    completedAt: '2026-09-06T06:00:00.000Z',
    ...overrides,
  };
}

function credits(valuesNewestFirst: number[]): KaniAttemptV1[] {
  return valuesNewestFirst.map((credit, index) => attempt({
    attemptId: `credit_${index}`,
    partialCredit: credit,
    completedAt: new Date(Date.parse('2026-09-06T06:00:00.000Z') - index * 60_000).toISOString(),
  }));
}

describe('canonical evidence rollups', () => {
  it('reports improving, declining and steady trends only when both windows have enough evidence', () => {
    expect(deriveEvidenceRollup('improving', credits([1, 1, 0.9, 0.4, 0.5, 0.5])).trend).toBe('improving');
    expect(deriveEvidenceRollup('declining', credits([0.2, 0.4, 0.3, 0.9, 1, 0.9])).trend).toBe('declining');
    expect(deriveEvidenceRollup('steady', credits([0.8, 0.9, 0.8, 0.75, 0.8, 0.85])).trend).toBe('steady');
    expect(deriveEvidenceRollup('sparse', credits([1, 0.5, 1])).trend).toBe('insufficient');
  });

  it('uses scored evidence only for averages and confidence', () => {
    const rollup = deriveEvidenceRollup('mixed', [
      attempt({ attemptId: 'unscored', completedAt: '2026-09-06T06:10:00.000Z' }),
      ...credits([1, 0.5, 1]),
    ]);

    expect(rollup.attemptCount).toBe(4);
    expect(rollup.scoredCount).toBe(3);
    expect(rollup.confidence).toBe('medium');
    expect(rollup.recentAverageCredit).toBeCloseTo(5 / 6);
  });

  it('groups topic evidence and ignores attempts without a topic', () => {
    const rollups = deriveTopicEvidenceRollups([
      attempt({ attemptId: 't1', topicId: 'fractions', correct: false }),
      attempt({ attemptId: 't2', topicId: 'grammar', correct: true }),
      attempt({ attemptId: 'none', topicId: undefined, correct: false }),
    ]);

    expect([...rollups.keys()].sort()).toEqual(['fractions', 'grammar']);
    expect(rollups.get('fractions')?.revisionSignal).toBe('needs_practice');
  });

  it('groups an attempt into each unique non-empty skill id', () => {
    const rollups = deriveSkillEvidenceRollups([
      attempt({ attemptId: 's1', skillIds: ['fractions', 'comparison', 'fractions', ''], correct: false }),
    ]);

    expect([...rollups.keys()].sort()).toEqual(['comparison', 'fractions']);
    expect(rollups.get('fractions')?.attemptCount).toBe(1);
  });

  it('ranks practice focus by lower recent credit and strong evidence by higher credit', () => {
    const focus = new Map([
      ['weak', deriveEvidenceRollup('weak', credits([0, 0.2, 0.4]))],
      ['less-weak', deriveEvidenceRollup('less-weak', credits([0.5, 0.5, 0.5]))],
      ['strong', deriveEvidenceRollup('strong', credits([1, 1, 1]))],
    ]);

    expect(getPracticeFocusRollups(focus).map((item) => item.id)).toEqual(['weak', 'less-weak']);
    expect(getStrongEvidenceRollups(focus).map((item) => item.id)).toEqual(['strong']);
  });
});
