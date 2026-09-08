import { KaniQuestion } from './contracts';
import { KaniContractError, parseKaniQuestion } from './validators';

export const PATTERN_DIAGNOSTIC_ACTIVITY_ID = 'patterns.diagnostic.initial';
export const PATTERN_DIAGNOSTIC_PATH = '/content/diagnostics/patterns-initial.json';
export const PATTERN_DIAGNOSTIC_QUESTION_COUNT = 26;

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

function validatePatternProbeIdentity(question: KaniQuestion) {
  if (!question.id.startsWith('patterns.probe.')) throw new KaniContractError(`Unexpected Patterns diagnostic question id ${question.id}`);
  if (question.skillIds.length !== 1 || !question.skillIds[0].startsWith('patterns.')) {
    throw new KaniContractError(`Patterns diagnostic question ${question.id} must reference exactly one Patterns skill`);
  }
  if (question.difficulty !== 'none') throw new KaniContractError(`Patterns diagnostic question ${question.id} must use difficulty none`);
  if (!question.conceptTags.includes('patterns') || !question.conceptTags.includes('diagnostic-probe')) {
    throw new KaniContractError(`Patterns diagnostic question ${question.id} is missing diagnostic concept tags`);
  }
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
