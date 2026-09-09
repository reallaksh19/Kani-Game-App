import { KaniAttemptV1 } from './contracts';
import { assertKaniAttempt, KaniContractError } from './validators';
import { PATTERN_DIAGNOSTIC_ACTIVITY_ID } from './PatternDiagnosticClient';

export const PATTERN_DIAGNOSTIC_HANDOFF_ROUTE = '#/patterns/diagnostic-bridge';
export const PATTERN_DIAGNOSTIC_MAX_ATTEMPTS = 26;
export const PATTERN_DIAGNOSTIC_MAX_PAYLOAD_BYTES = 64 * 1024;

export function buildPatternDiagnosticBridgeUrl(
  studyHubBaseUrl: string,
  attempts: KaniAttemptV1[],
): string {
  const selected = validatePatternDiagnosticAttempts(attempts);
  const payload = JSON.stringify({
    schemaVersion: '1.0',
    activityId: PATTERN_DIAGNOSTIC_ACTIVITY_ID,
    attempts: selected,
  });
  if (new TextEncoder().encode(payload).length > PATTERN_DIAGNOSTIC_MAX_PAYLOAD_BYTES) {
    throw new KaniContractError('Patterns diagnostic handoff payload exceeds 64 KiB');
  }
  const base = normalizeBaseUrl(studyHubBaseUrl);
  return `${base}/${PATTERN_DIAGNOSTIC_HANDOFF_ROUTE}?payload=${encodeURIComponent(payload)}`;
}

export function validatePatternDiagnosticAttempts(attempts: KaniAttemptV1[]): KaniAttemptV1[] {
  if (!Array.isArray(attempts) || attempts.length === 0) throw new KaniContractError('Patterns diagnostic handoff requires attempts');
  if (attempts.length > PATTERN_DIAGNOSTIC_MAX_ATTEMPTS) throw new KaniContractError('Patterns diagnostic handoff supports at most 26 attempts');

  const studentId = attempts[0]?.studentId;
  if (typeof studentId !== 'string' || !studentId.trim()) throw new KaniContractError('Patterns diagnostic handoff requires a stable studentId');
  const questionIds = new Set<string>();

  attempts.forEach((attempt, index) => {
    assertKaniAttempt(attempt);
    if (attempt.activityId !== PATTERN_DIAGNOSTIC_ACTIVITY_ID) throw new KaniContractError(`Patterns diagnostic attempt ${index} has the wrong activityId`);
    if (attempt.studentId !== studentId) throw new KaniContractError('Patterns diagnostic handoff cannot mix students');
    if (typeof attempt.questionId !== 'string' || !attempt.questionId.startsWith('patterns.probe.')) {
      throw new KaniContractError(`Patterns diagnostic attempt ${index} has an invalid questionId`);
    }
    if (questionIds.has(attempt.questionId)) throw new KaniContractError(`Patterns diagnostic handoff contains duplicate questionId ${attempt.questionId}`);
    questionIds.add(attempt.questionId);
  });

  return [...attempts];
}

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new KaniContractError('Study-Hub base URL is required');
  return trimmed.replace(/\/+$/, '');
}
