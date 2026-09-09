import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { KaniAttemptV1 } from './contracts';
import { PATTERN_DIAGNOSTIC_ACTIVITY_ID } from './PatternDiagnosticClient';
import {
  buildPatternDiagnosticBridgeUrl,
  validatePatternDiagnosticAttempts,
} from './patternDiagnosticHandoff';

const STUDENT_ID = 'student_m004_patterns';

function attempt(index: number, overrides: Partial<KaniAttemptV1> = {}): KaniAttemptV1 {
  return {
    schemaVersion: '1.0',
    attemptId: `attempt_${index}`,
    studentId: STUDENT_ID,
    activityId: PATTERN_DIAGNOSTIC_ACTIVITY_ID,
    activityType: 'quiz',
    sourceApp: 'study-hub',
    questionId: `patterns.probe.skill_${index}.${index + 1}`,
    skillIds: [`patterns.skill_${index}`],
    difficulty: 'none',
    correct: index % 2 === 0,
    partialCredit: index % 2 === 0 ? 1 : 0,
    responseTimeMs: 1000 + index,
    hintsUsed: 0,
    completedAt: '2026-09-08T17:30:00.000Z',
    ...overrides,
  };
}

describe('patternDiagnosticHandoff', () => {
  it('builds a fragment-only Study-Hub URL from exactly the selected attempts', () => {
    const selected = [attempt(0), attempt(1)];
    const snapshot = JSON.stringify(selected);
    const url = buildPatternDiagnosticBridgeUrl('https://example.test/Study-Hub/', selected);
    const parsed = new URL(url);

    expect(parsed.origin + parsed.pathname).toBe('https://example.test/Study-Hub/');
    expect(parsed.search).toBe('');
    expect(parsed.hash.startsWith('#/patterns/diagnostic-bridge?payload=')).toBe(true);
    expect(JSON.stringify(selected)).toBe(snapshot);

    const encoded = new URLSearchParams(parsed.hash.split('?')[1]).get('payload');
    expect(encoded).toBeTruthy();
    const payload = JSON.parse(encoded!);
    expect(payload.activityId).toBe(PATTERN_DIAGNOSTIC_ACTIVITY_ID);
    expect(payload.attempts).toEqual(selected);
  });

  it('returns a copy without deleting or rewriting local attempt objects', () => {
    const selected = [attempt(0), attempt(1)];
    const validated = validatePatternDiagnosticAttempts(selected);
    expect(validated).toEqual(selected);
    expect(validated).not.toBe(selected);
    expect(validated[0]).toBe(selected[0]);
  });

  it('rejects oversized counts, mixed students, wrong activities and duplicate probes', () => {
    expect(() => validatePatternDiagnosticAttempts(Array.from({ length: 27 }, (_, index) => attempt(index)))).toThrow(/at most 26/);
    expect(() => validatePatternDiagnosticAttempts([attempt(0), attempt(1, { studentId: 'student_other' })])).toThrow(/mix students/);
    expect(() => validatePatternDiagnosticAttempts([attempt(0, { activityId: 'patterns.diagnostic.other' })])).toThrow(/wrong activityId/);
    expect(() => validatePatternDiagnosticAttempts([
      attempt(0, { attemptId: 'duplicate_a' }),
      attempt(1, { attemptId: 'duplicate_b', questionId: attempt(0).questionId }),
    ])).toThrow(/duplicate questionId/);
  });

  it('rejects decoded payloads above the 64 KiB bound before navigation', () => {
    const padded = attempt(0) as KaniAttemptV1 & { padding: string };
    padded.padding = 'x'.repeat(70_000);
    expect(() => buildPatternDiagnosticBridgeUrl('https://example.test/Study-Hub', [padded])).toThrow(/64 KiB/);
  });

  it('keeps learner-facing pilot copy evidence-focused and uses the just-completed attempts', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'src', 'components', 'integration', 'PatternsDiagnosticPilot.tsx'),
      'utf8',
    );
    expect(source).toContain('buildPatternDiagnosticBridgeUrl(studyHubBaseUrl, nextResult.attempts)');
    expect(source).toContain('for (const attempt of nextResult.attempts) await attemptStore.recordAttempt(attempt)');
    expect(source).not.toContain('{result.correctCount}');
    expect(source).not.toMatch(/mastery score|ability score|grade placement/i);
  });
});
