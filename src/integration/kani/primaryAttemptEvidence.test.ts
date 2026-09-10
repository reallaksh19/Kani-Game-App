import { describe, expect, it } from 'vitest';
import type { KaniAttemptV1 } from './contracts';
import { assertKaniAttempt, KaniContractError } from './validators';

const baseAttempt: KaniAttemptV1 = {
  schemaVersion: '1.0',
  attemptId: 'attempt-primary-evidence-1',
  studentId: 'student-1',
  activityId: 'fraction-frenzy',
  activityType: 'game',
  sourceApp: 'game-app',
  skillIds: ['skill_fraction_equivalence'],
  difficulty: 'medium',
  correct: true,
  completedAt: '2026-09-10T19:20:00.000Z',
};

const primaryEvidence = {
  semanticVersion: '1.0' as const,
  learningEpisodeId: 'EP-G4-FRAC-EQUIV-001',
  learningObjectIds: ['MATH-FRAC-EQUIVALENCE'],
  questionFamilyId: 'fraction-equiv-visual-family',
  selfCorrected: true,
  confidenceBefore: 'LOW' as const,
  confidenceAfter: 'MEDIUM' as const,
  conceptualSupport: { level: 'H1', type: 'PROMPT' },
  accessAdjustments: ['REDUCED_LANGUAGE', 'ONE_STEP_AT_A_TIME'],
  representation: { type: 'FRACTION_MODEL', role: 'CHILD_SELECTED' },
  responseMode: 'DRAWN',
  errorSignature: {
    source: 'AUTHORED_RESPONSE_CLASSIFICATION' as const,
    code: 'NUMERATOR_ONLY_MATCH',
  },
};

describe('kani-attempt-v1 Primary evidence envelope', () => {
  it('remains backward-compatible when primaryEvidence is absent', () => {
    expect(() => assertKaniAttempt(baseAttempt)).not.toThrow();
  });

  it('accepts bounded observable Primary evidence', () => {
    const attempt: KaniAttemptV1 = { ...baseAttempt, primaryEvidence };
    expect(() => assertKaniAttempt(attempt)).not.toThrow();
  });

  it('rejects Teacher Runtime diagnosis inside raw attempt evidence', () => {
    const attempt = {
      ...baseAttempt,
      primaryEvidence: { ...primaryEvidence, diagnosis: 'fraction misconception' },
    };
    expect(() => assertKaniAttempt(attempt)).toThrow(KaniContractError);
  });

  it('rejects pedagogical judgement smuggled into nested representation evidence', () => {
    const attempt = {
      ...baseAttempt,
      primaryEvidence: {
        ...primaryEvidence,
        representation: {
          ...primaryEvidence.representation,
          teacherDecision: 'reteach',
        },
      },
    };
    expect(() => assertKaniAttempt(attempt)).toThrow(KaniContractError);
  });

  it('requires non-empty learningObjectIds when the field is present', () => {
    const attempt = {
      ...baseAttempt,
      primaryEvidence: { ...primaryEvidence, learningObjectIds: [] },
    };
    expect(() => assertKaniAttempt(attempt)).toThrow(KaniContractError);
  });

  it('rejects confidence values outside the canonical transport contract', () => {
    const attempt = {
      ...baseAttempt,
      primaryEvidence: { ...primaryEvidence, confidenceAfter: 'VERY_HIGH' },
    };
    expect(() => assertKaniAttempt(attempt)).toThrow(KaniContractError);
  });
});
