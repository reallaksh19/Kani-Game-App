import { KaniQuestion } from './contracts';
import { KaniContractError, parseKaniQuestion } from './validators';

export const PATTERN_DIAGNOSTIC_ACTIVITY_ID = 'patterns.diagnostic.initial';
export const PATTERN_DIAGNOSTIC_PATH = '/content/diagnostics/patterns-initial.json';
export const PATTERN_DIAGNOSTIC_QUESTION_COUNT = 26;

const PATTERN_DIAGNOSTIC_SKILL_SLUGS = [
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
] as const;

const PATTERN_DIAGNOSTIC_EXPECTED_IDS = PATTERN_DIAGNOSTIC_SKILL_SLUGS.flatMap((slug) => [
  `patterns.probe.${slug}.1`,
  `patterns.probe.${slug}.2`,
]);

export interface PatternDiagnosticEnvelope {
  schemaVersion: '1.0';
  activityId: typeof PATTERN_DIAGNOSTIC_ACTIVITY_ID;
  sourceApp: 'study-hub';
  questions: KaniQuestion[];
}

export type PatternDiagnosticFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export function resolvePatternDiagnosticUrl(baseUrl: string): string {
  const normalized = normalizeBaseUrl(baseUrl);
  return `${normalized}${PATTERN_DIAGNOSTIC_PATH}`;
}

export async function fetchPatternDiagnostic(
  baseUrl: string,
  fetchFn: PatternDiagnosticFetch = fetch.bind(globalThis),
): Promise<PatternDiagnosticEnvelope> {
  const url = resolvePatternDiagnosticUrl(baseUrl);
  const response = await fetchFn(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new KaniContractError(`Patterns diagnostic request failed (${response.status})`);

  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    throw new KaniContractError('Patterns diagnostic returned invalid JSON');
  }
  return parsePatternDiagnosticEnvelope(raw);
}

export function parsePatternDiagnosticEnvelope(value: unknown): PatternDiagnosticEnvelope {
  if (!isRecord(value)) throw new KaniContractError('Patterns diagnostic envelope must be an object');
  if (value.schemaVersion !== '1.0') throw new KaniContractError('Patterns diagnostic schemaVersion must equal 1.0');
  if (value.activityId !== PATTERN_DIAGNOSTIC_ACTIVITY_ID) throw new KaniContractError('Patterns diagnostic activityId mismatch');
  if (value.sourceApp !== 'study-hub') throw new KaniContractError('Patterns diagnostic sourceApp must be study-hub');
  if (!Array.isArray(value.questions) || value.questions.length !== PATTERN_DIAGNOSTIC_QUESTION_COUNT) {
    throw new KaniContractError(`Patterns diagnostic must contain exactly ${PATTERN_DIAGNOSTIC_QUESTION_COUNT} questions`);
  }

  const questions = value.questions.map(parseKaniQuestion);
  const ids = questions.map((question) => question.id);
  if (new Set(ids).size !== ids.length) throw new KaniContractError('Patterns diagnostic contains duplicate question ids');
  questions.forEach(validatePatternProbeIdentity);

  return {
    schemaVersion: '1.0',
    activityId: PATTERN_DIAGNOSTIC_ACTIVITY_ID,
    sourceApp: 'study-hub',
    questions,
  };
}

function validatePatternProbeIdentity(question: KaniQuestion, index: number) {
  const expectedId = PATTERN_DIAGNOSTIC_EXPECTED_IDS[index];
  if (question.id !== expectedId) {
    throw new KaniContractError(`Patterns diagnostic question ${index + 1} must be ${expectedId}`);
  }

  const expectedSlug = PATTERN_DIAGNOSTIC_SKILL_SLUGS[Math.floor(index / 2)];
  const expectedSkillId = `patterns.${expectedSlug}`;
  if (question.skillIds.length !== 1 || question.skillIds[0] !== expectedSkillId) {
    throw new KaniContractError(`Patterns diagnostic question ${question.id} must reference exactly ${expectedSkillId}`);
  }
  if (question.difficulty !== 'none') throw new KaniContractError(`Patterns diagnostic question ${question.id} must use difficulty none`);
  if (question.conceptTags.length !== 2 || question.conceptTags[0] !== 'patterns' || question.conceptTags[1] !== 'diagnostic-probe') {
    throw new KaniContractError(`Patterns diagnostic question ${question.id} must use the exact diagnostic concept tags`);
  }
  if (question.curriculumTags.length !== 0) {
    throw new KaniContractError(`Patterns diagnostic question ${question.id} must not add curriculum tags`);
  }
  if (!question.hint?.trim()) throw new KaniContractError(`Patterns diagnostic question ${question.id} must include a hint`);
  if (question.type !== 'mcq' && question.type !== 'numeric' && question.type !== 'sequence_order') {
    throw new KaniContractError(`Patterns diagnostic question ${question.id} uses an unsupported pilot type`);
  }
}

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new KaniContractError('Study-Hub base URL is required');
  return trimmed.replace(/\/+$/, '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
