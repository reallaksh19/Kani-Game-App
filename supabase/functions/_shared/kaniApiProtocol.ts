export const KANI_API_VERSION = 'v1' as const;
export const KANI_SCHEMA_VERSION = '1.0' as const;
export const MAX_ATTEMPT_BATCH = 50;
export const MAX_REQUEST_BYTES = 256 * 1024;
export const DEFAULT_HISTORY_LIMIT = 50;
export const MAX_HISTORY_LIMIT = 100;

const DIFFICULTIES = new Set(['easy', 'medium', 'hard', 'mixed', 'none']);
const ACTIVITY_TYPES = new Set(['lesson', 'worksheet', 'quiz', 'game', 'brain', 'challenge', 'interactive']);
const SOURCE_APPS = new Set(['study-hub', 'game-app', 'worksheet-app']);

export class KaniApiInputError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, code = 'INVALID_REQUEST', status = 400) {
    super(message);
    this.name = 'KaniApiInputError';
    this.status = status;
    this.code = code;
  }
}

export interface KaniAttemptPayload {
  schemaVersion: typeof KANI_SCHEMA_VERSION;
  attemptId: string;
  studentId: string;
  activityId: string;
  activityType: string;
  sourceApp: string;
  subjectId?: string;
  topicId?: string;
  pageId?: string;
  questionId?: string;
  roundId?: string;
  skillIds: string[];
  difficulty: string;
  correct?: boolean;
  partialCredit?: number;
  responseTimeMs?: number;
  hintsUsed?: number;
  score?: number;
  startedAt?: string;
  completedAt: string;
  [key: string]: unknown;
}

export interface KaniStudentInput {
  id: string;
  name: string;
  avatar: string;
  grade: string;
}

export type KaniApiRoute =
  | { kind: 'students.list' }
  | { kind: 'students.create' }
  | { kind: 'attempts.create' }
  | { kind: 'student.history'; studentId: string }
  | { kind: 'student.revision'; studentId: string }
  | { kind: 'student.recommendations'; studentId: string };

export interface HistoryCursor {
  completedAt: string;
  attemptId: string;
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isIsoDateTime = (value: unknown): value is string => isNonEmptyString(value) && value.includes('T') && !Number.isNaN(Date.parse(value));
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

function requireString(value: unknown, label: string, maxLength = 240): string {
  if (!isNonEmptyString(value)) throw new KaniApiInputError(`${label} must be a non-empty string`);
  const trimmed = value.trim();
  if (trimmed.length > maxLength) throw new KaniApiInputError(`${label} is too long`);
  return trimmed;
}

function optionalString(value: unknown, label: string, maxLength = 240): string | undefined {
  if (value === undefined) return undefined;
  return requireString(value, label, maxLength);
}

function requireStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) throw new KaniApiInputError(`${label} must be an array`);
  const normalized = value.map((item, index) => requireString(item, `${label}[${index}]`, 160));
  return [...new Set(normalized)];
}

export function parseAllowedOrigins(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const values = raw.split(',').map((value) => value.trim()).filter(Boolean);
  const origins: string[] = [];
  for (const value of values) {
    if (value === '*') throw new KaniApiInputError('Wildcard CORS origin is not allowed', 'UNSAFE_CORS_CONFIG', 500);
    let origin: string;
    try {
      origin = new URL(value).origin;
    } catch {
      throw new KaniApiInputError(`Invalid CORS origin: ${value}`, 'INVALID_CORS_CONFIG', 500);
    }
    if (origin !== value.replace(/\/$/, '')) {
      throw new KaniApiInputError(`CORS entry must be an origin without a path: ${value}`, 'INVALID_CORS_CONFIG', 500);
    }
    if (!origins.includes(origin)) origins.push(origin);
  }
  return origins;
}

export function corsHeadersForOrigin(origin: string | null, allowedOrigins: readonly string[]): Record<string, string> {
  if (!origin || !allowedOrigins.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-kani-household-id, x-retry-count, traceparent, tracestate, baggage',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '600',
    'Vary': 'Origin',
  };
}

export function assertAllowedBrowserOrigin(origin: string | null, allowedOrigins: readonly string[]): void {
  if (origin && !allowedOrigins.includes(origin)) {
    throw new KaniApiInputError('Request origin is not allowed', 'ORIGIN_NOT_ALLOWED', 403);
  }
}

function normalizeApiPath(pathname: string): string {
  const marker = '/api/v1';
  const index = pathname.indexOf(marker);
  if (index < 0) return pathname.replace(/\/+$/, '') || '/';
  return pathname.slice(index).replace(/\/+$/, '') || marker;
}

export function matchKaniApiRoute(method: string, pathname: string): KaniApiRoute {
  const path = normalizeApiPath(pathname);
  const normalizedMethod = method.toUpperCase();
  if (path === '/api/v1/students' && normalizedMethod === 'GET') return { kind: 'students.list' };
  if (path === '/api/v1/students' && normalizedMethod === 'POST') return { kind: 'students.create' };
  if (path === '/api/v1/attempts' && normalizedMethod === 'POST') return { kind: 'attempts.create' };

  const match = path.match(/^\/api\/v1\/students\/([^/]+)\/(history|revision|recommendations)$/);
  if (match && normalizedMethod === 'GET') {
    let studentId: string;
    try {
      studentId = decodeURIComponent(match[1]);
    } catch {
      throw new KaniApiInputError('Student id is not valid URL encoding');
    }
    studentId = requireString(studentId, 'studentId', 160);
    if (match[2] === 'history') return { kind: 'student.history', studentId };
    if (match[2] === 'revision') return { kind: 'student.revision', studentId };
    return { kind: 'student.recommendations', studentId };
  }

  throw new KaniApiInputError('API route not found', 'NOT_FOUND', 404);
}

export function parseStudentInput(value: unknown): KaniStudentInput {
  if (!isObject(value)) throw new KaniApiInputError('Student payload must be an object');
  return {
    id: requireString(value.id, 'student.id', 160),
    name: requireString(value.name, 'student.name', 120),
    avatar: value.avatar === undefined ? '🧑‍🚀' : requireString(value.avatar, 'student.avatar', 32),
    grade: value.grade === undefined ? 'Grade 4' : requireString(value.grade, 'student.grade', 64),
  };
}

export function parseKaniAttemptPayload(value: unknown): KaniAttemptPayload {
  if (!isObject(value)) throw new KaniApiInputError('Attempt must be an object');
  if (value.schemaVersion !== KANI_SCHEMA_VERSION) throw new KaniApiInputError(`attempt.schemaVersion must equal ${KANI_SCHEMA_VERSION}`);

  const activityType = requireString(value.activityType, 'attempt.activityType', 32);
  if (!ACTIVITY_TYPES.has(activityType)) throw new KaniApiInputError('attempt.activityType is unsupported');
  const sourceApp = requireString(value.sourceApp, 'attempt.sourceApp', 32);
  if (!SOURCE_APPS.has(sourceApp)) throw new KaniApiInputError('attempt.sourceApp is unsupported');
  const difficulty = requireString(value.difficulty, 'attempt.difficulty', 16);
  if (!DIFFICULTIES.has(difficulty)) throw new KaniApiInputError('attempt.difficulty is unsupported');

  if (value.correct !== undefined && typeof value.correct !== 'boolean') throw new KaniApiInputError('attempt.correct must be boolean');
  if (value.partialCredit !== undefined && (!isFiniteNumber(value.partialCredit) || value.partialCredit < 0 || value.partialCredit > 1)) {
    throw new KaniApiInputError('attempt.partialCredit must be between 0 and 1');
  }
  for (const key of ['responseTimeMs', 'hintsUsed'] as const) {
    const numeric = value[key];
    if (numeric !== undefined && (!isFiniteNumber(numeric) || numeric < 0)) throw new KaniApiInputError(`attempt.${key} must be a non-negative finite number`);
  }
  if (value.score !== undefined && !isFiniteNumber(value.score)) throw new KaniApiInputError('attempt.score must be finite');
  if (!isIsoDateTime(value.completedAt)) throw new KaniApiInputError('attempt.completedAt must be ISO-8601');
  if (value.startedAt !== undefined && !isIsoDateTime(value.startedAt)) throw new KaniApiInputError('attempt.startedAt must be ISO-8601');

  return {
    ...value,
    schemaVersion: KANI_SCHEMA_VERSION,
    attemptId: requireString(value.attemptId, 'attempt.attemptId', 200),
    studentId: requireString(value.studentId, 'attempt.studentId', 160),
    activityId: requireString(value.activityId, 'attempt.activityId', 240),
    activityType,
    sourceApp,
    subjectId: optionalString(value.subjectId, 'attempt.subjectId', 160),
    topicId: optionalString(value.topicId, 'attempt.topicId', 160),
    pageId: optionalString(value.pageId, 'attempt.pageId', 200),
    questionId: optionalString(value.questionId, 'attempt.questionId', 200),
    roundId: optionalString(value.roundId, 'attempt.roundId', 200),
    skillIds: requireStringArray(value.skillIds, 'attempt.skillIds'),
    difficulty,
    correct: value.correct as boolean | undefined,
    partialCredit: value.partialCredit as number | undefined,
    responseTimeMs: value.responseTimeMs as number | undefined,
    hintsUsed: value.hintsUsed as number | undefined,
    score: value.score as number | undefined,
    startedAt: value.startedAt as string | undefined,
    completedAt: value.completedAt as string,
  };
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isObject(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}

export function stableJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function parseAttemptBatch(value: unknown): KaniAttemptPayload[] {
  if (!isObject(value) || !Array.isArray(value.attempts)) throw new KaniApiInputError('Body must contain attempts[]');
  if (value.attempts.length === 0) throw new KaniApiInputError('attempts[] cannot be empty');
  if (value.attempts.length > MAX_ATTEMPT_BATCH) throw new KaniApiInputError(`attempts[] cannot exceed ${MAX_ATTEMPT_BATCH} items`, 'BATCH_TOO_LARGE', 413);

  const byId = new Map<string, KaniAttemptPayload>();
  for (const item of value.attempts) {
    const attempt = parseKaniAttemptPayload(item);
    const prior = byId.get(attempt.attemptId);
    if (!prior) {
      byId.set(attempt.attemptId, attempt);
      continue;
    }
    if (stableJson(prior) !== stableJson(attempt)) {
      throw new KaniApiInputError(`Conflicting duplicate attemptId ${attempt.attemptId} in one batch`, 'ATTEMPT_ID_CONFLICT', 409);
    }
  }
  return [...byId.values()];
}

export function attemptToDatabaseRow(householdId: string, attempt: KaniAttemptPayload): Record<string, unknown> {
  return {
    household_id: householdId,
    attempt_id: attempt.attemptId,
    student_id: attempt.studentId,
    schema_version: attempt.schemaVersion,
    activity_id: attempt.activityId,
    activity_type: attempt.activityType,
    source_app: attempt.sourceApp,
    subject_id: attempt.subjectId ?? null,
    topic_id: attempt.topicId ?? null,
    page_id: attempt.pageId ?? null,
    question_id: attempt.questionId ?? null,
    round_id: attempt.roundId ?? null,
    skill_ids: attempt.skillIds,
    difficulty: attempt.difficulty,
    correct: attempt.correct ?? null,
    partial_credit: attempt.partialCredit ?? null,
    response_time_ms: attempt.responseTimeMs ?? null,
    hints_used: attempt.hintsUsed ?? null,
    score: attempt.score ?? null,
    started_at: attempt.startedAt ?? null,
    completed_at: attempt.completedAt,
    payload: attempt,
  };
}

function base64UrlEncode(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeHistoryCursor(cursor: HistoryCursor): string {
  return base64UrlEncode(JSON.stringify(cursor));
}

export function decodeHistoryCursor(value: string | null): HistoryCursor | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(base64UrlDecode(value));
    if (!isObject(parsed) || !isIsoDateTime(parsed.completedAt) || !isNonEmptyString(parsed.attemptId)) throw new Error('invalid');
    return { completedAt: parsed.completedAt, attemptId: parsed.attemptId };
  } catch {
    throw new KaniApiInputError('History cursor is invalid', 'INVALID_CURSOR');
  }
}

export function parseHistoryLimit(value: string | null): number {
  if (!value) return DEFAULT_HISTORY_LIMIT;
  if (!/^\d+$/.test(value)) throw new KaniApiInputError('History limit must be a positive integer');
  const parsed = Number(value);
  if (parsed < 1) throw new KaniApiInputError('History limit must be at least 1');
  return Math.min(parsed, MAX_HISTORY_LIMIT);
}
