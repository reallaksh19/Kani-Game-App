import { describe, expect, it, vi } from 'vitest';
import {
  PATTERN_DIAGNOSTIC_ACTIVITY_ID,
  PATTERN_DIAGNOSTIC_PATH,
  fetchPatternDiagnostic,
  parsePatternDiagnosticEnvelope,
  resolvePatternDiagnosticUrl,
} from './PatternDiagnosticClient';

const SKILLS = [
  'observe_sequence_order',
  'compare_pattern_attributes',
  'recognize_repetition',
  'identify_repeating_unit',
  'continue_repeating_pattern',
  'find_missing_repeating_element',
  'recognize_growing_pattern',
  'describe_constant_change',
  'continue_additive_number_pattern',
  'identify_alternating_rule',
  'find_missing_pattern_term',
  'detect_incorrect_pattern_term',
  'solve_mixed_pattern_reasoning',
];

const questions = SKILLS.flatMap((slug) => [1, 2].map((number, index) => ({
  schemaVersion: '1.0',
  id: `patterns.probe.${slug}.${number}`,
  type: index === 0 ? 'mcq' : 'numeric',
  prompt: `Probe ${slug} ${number}`,
  skillIds: [`patterns.${slug}`],
  conceptTags: ['patterns', 'diagnostic-probe'],
  difficulty: 'none',
  curriculumTags: [],
  hint: 'Use the pattern information shown.',
  ...(index === 0
    ? { options: ['A', 'B'], answerIndex: 0 }
    : { answer: 2, tolerance: 0 }),
})));

const envelope = {
  schemaVersion: '1.0',
  activityId: PATTERN_DIAGNOSTIC_ACTIVITY_ID,
  sourceApp: 'study-hub',
  questions,
};

function jsonResponse(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('PatternDiagnosticClient', () => {
  it('resolves the locked static endpoint from the Study-Hub base URL', () => {
    expect(resolvePatternDiagnosticUrl('https://example.test/Study-Hub/')).toBe(`https://example.test/Study-Hub${PATTERN_DIAGNOSTIC_PATH}`);
  });

  it('fetches and validates exactly 26 canonical diagnostic questions', async () => {
    const fetchFn = vi.fn(async () => jsonResponse(envelope));
    const result = await fetchPatternDiagnostic('https://example.test/Study-Hub', fetchFn);
    expect(result.activityId).toBe(PATTERN_DIAGNOSTIC_ACTIVITY_ID);
    expect(result.questions).toHaveLength(26);
    expect(new Set(result.questions.map((question) => question.id)).size).toBe(26);
    expect(fetchFn).toHaveBeenCalledWith(
      'https://example.test/Study-Hub/content/diagnostics/patterns-initial.json',
      { headers: { Accept: 'application/json' } },
    );
  });

  it('rejects wrong envelope identity and invalid question contracts', () => {
    expect(() => parsePatternDiagnosticEnvelope({ ...envelope, activityId: 'patterns.diagnostic.other' })).toThrow(/activityId mismatch/);
    expect(() => parsePatternDiagnosticEnvelope({ ...envelope, sourceApp: 'game-app' })).toThrow(/sourceApp/);
    expect(() => parsePatternDiagnosticEnvelope({ ...envelope, questions: questions.slice(0, 25) })).toThrow(/exactly 26/);
    expect(() => parsePatternDiagnosticEnvelope({ ...envelope, questions: questions.map((question, index) => index === 0 ? { ...question, curriculumTags: undefined } : question) })).toThrow(/curriculumTags/);
  });

  it('rejects duplicate ids and non-diagnostic identity metadata', () => {
    const duplicate = questions.map((question, index) => index === 1 ? { ...question, id: questions[0].id } : question);
    expect(() => parsePatternDiagnosticEnvelope({ ...envelope, questions: duplicate })).toThrow(/duplicate question ids/);
    const wrongDifficulty = questions.map((question, index) => index === 0 ? { ...question, difficulty: 'easy' } : question);
    expect(() => parsePatternDiagnosticEnvelope({ ...envelope, questions: wrongDifficulty })).toThrow(/difficulty none/);
  });
});
