import { describe, expect, it } from 'vitest';
import {
  KaniApiInputError,
  MAX_ATTEMPT_BATCH,
  assertAllowedBrowserOrigin,
  attemptToDatabaseRow,
  corsHeadersForOrigin,
  decodeHistoryCursor,
  encodeHistoryCursor,
  matchKaniApiRoute,
  parseAllowedOrigins,
  parseAttemptBatch,
  parseHistoryLimit,
  parseKaniAttemptPayload,
  parseStudentInput,
  stableJson,
} from '../../../supabase/functions/_shared/kaniApiProtocol';
import { KaniAttemptV1 } from './contracts';
import { assertKaniAttempt } from './validators';

const attempt = (overrides: Partial<KaniAttemptV1> = {}): KaniAttemptV1 => ({
  schemaVersion: '1.0',
  attemptId: 'attempt-1',
  studentId: 'student_alex_1000',
  activityId: 'studyhub:grade4math-number-system-practice',
  activityType: 'worksheet',
  sourceApp: 'study-hub',
  subjectId: 'grade4math',
  topicId: 'grade4math-number-system',
  pageId: 'grade4math-number-system-practice',
  questionId: 'grade4math-number-system-q01',
  skillIds: ['skill-expanded-form'],
  difficulty: 'easy',
  correct: false,
  partialCredit: 0,
  responseTimeMs: 4200,
  hintsUsed: 1,
  completedAt: '2026-09-06T06:00:00.000Z',
  ...overrides,
});

describe('Kani learner API protocol', () => {
  it('matches versioned routes behind the Supabase function prefix', () => {
    expect(matchKaniApiRoute('GET', '/functions/v1/kani-api/api/v1/students')).toEqual({ kind: 'students.list' });
    expect(matchKaniApiRoute('POST', '/api/v1/attempts')).toEqual({ kind: 'attempts.create' });
    expect(matchKaniApiRoute('GET', '/functions/v1/kani-api/api/v1/students/student%20one/history')).toEqual({
      kind: 'student.history',
      studentId: 'student one',
    });
    expect(() => matchKaniApiRoute('DELETE', '/api/v1/students')).toThrowError(KaniApiInputError);
  });

  it('uses exact browser origins and rejects wildcard configuration', () => {
    const origins = parseAllowedOrigins('https://reallaksh19.github.io,http://localhost:5173');
    expect(origins).toEqual(['https://reallaksh19.github.io', 'http://localhost:5173']);
    expect(corsHeadersForOrigin('https://reallaksh19.github.io', origins)['Access-Control-Allow-Origin']).toBe('https://reallaksh19.github.io');
    expect(corsHeadersForOrigin('https://evil.example', origins)).toEqual({});
    expect(() => assertAllowedBrowserOrigin('https://evil.example', origins)).toThrowError(/not allowed/i);
    expect(() => parseAllowedOrigins('*')).toThrowError(/wildcard/i);
  });

  it('parses existing local student IDs without renaming them', () => {
    expect(parseStudentInput({ id: 'student_alex_1788670000000', name: 'Alex', avatar: '🦊', grade: 'Grade 4' })).toEqual({
      id: 'student_alex_1788670000000',
      name: 'Alex',
      avatar: '🦊',
      grade: 'Grade 4',
    });
  });

  it('keeps server attempt validation aligned with the current kani-attempt-v1 validator', () => {
    const valid = attempt({ partialCredit: 0.5, correct: false });
    expect(() => assertKaniAttempt(valid)).not.toThrow();
    expect(parseKaniAttemptPayload(valid)).toMatchObject(valid);

    const invalid = { ...valid, partialCredit: 1.5 };
    expect(() => assertKaniAttempt(invalid)).toThrow();
    expect(() => parseKaniAttemptPayload(invalid)).toThrow();
  });

  it('deduplicates identical attempt IDs but rejects conflicting payloads', () => {
    const sameA = attempt();
    const sameB = { ...attempt(), skillIds: ['skill-expanded-form'] };
    expect(parseAttemptBatch({ attempts: [sameA, sameB] })).toHaveLength(1);

    expect(() => parseAttemptBatch({ attempts: [sameA, attempt({ correct: true, partialCredit: 1 })] }))
      .toThrowError(/conflicting duplicate/i);
  });

  it('caps upload batches and history page sizes', () => {
    const tooMany = Array.from({ length: MAX_ATTEMPT_BATCH + 1 }, (_, index) => attempt({ attemptId: `attempt-${index}` }));
    expect(() => parseAttemptBatch({ attempts: tooMany })).toThrowError(/cannot exceed/i);
    expect(parseHistoryLimit(null)).toBe(50);
    expect(parseHistoryLimit('500')).toBe(100);
    expect(() => parseHistoryLimit('0')).toThrow();
  });

  it('maps canonical attempts to indexed database projections without changing the payload', () => {
    const value = attempt({ score: 12 });
    const row = attemptToDatabaseRow('household-1', parseKaniAttemptPayload(value));
    expect(row.household_id).toBe('household-1');
    expect(row.attempt_id).toBe('attempt-1');
    expect(row.question_id).toBe('grade4math-number-system-q01');
    expect(row.skill_ids).toEqual(['skill-expanded-form']);
    expect(row.payload).toMatchObject(value);
  });

  it('round-trips opaque history cursors and rejects malformed cursors', () => {
    const cursor = { completedAt: '2026-09-06T06:00:00.000Z', attemptId: 'attempt-1' };
    const encoded = encodeHistoryCursor(cursor);
    expect(encoded).not.toContain('{');
    expect(decodeHistoryCursor(encoded)).toEqual(cursor);
    expect(() => decodeHistoryCursor('not-a-cursor')).toThrowError(/cursor is invalid/i);
  });

  it('canonicalizes object key order for idempotency comparisons', () => {
    expect(stableJson({ b: 2, a: { z: 1, y: 2 } })).toBe(stableJson({ a: { y: 2, z: 1 }, b: 2 }));
  });
});
