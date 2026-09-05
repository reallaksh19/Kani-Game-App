import { KANI_SCHEMA_VERSION, KaniActivityMessage, KaniActivityType, KaniDifficulty } from './contracts';

export interface KaniLaunchContext {
  launchId: string;
  activityId: string;
  studentId: string;
  activityType: KaniActivityType;
  subjectId?: string;
  topicId?: string;
  pageId?: string;
  skillIds?: string[];
  difficulty?: KaniDifficulty;
}

export interface KaniBridgeAcceptResult {
  accepted: boolean;
  reason?: string;
  message?: KaniActivityMessage;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIsoDateTime(value: unknown): value is string {
  return isNonEmptyString(value) && value.includes('T') && !Number.isNaN(Date.parse(value));
}

const activityTypes = new Set<KaniActivityType>(['lesson', 'worksheet', 'quiz', 'game', 'brain', 'challenge', 'interactive']);
const difficulties = new Set<KaniDifficulty>(['easy', 'medium', 'hard', 'mixed', 'none']);

export function normalizeAllowedOrigins(values: readonly string[]): string[] {
  const result = new Set<string>();
  values.forEach((value) => {
    try {
      result.add(new URL(value).origin);
    } catch {
      // Ignore malformed configured values; an empty allowed-origin set rejects every external event.
    }
  });
  return [...result];
}

export function parseKaniActivityMessage(value: unknown): KaniActivityMessage | null {
  if (!isObject(value)) return null;
  if (value.schemaVersion !== KANI_SCHEMA_VERSION) return null;
  if (!isNonEmptyString(value.launchId) || !isNonEmptyString(value.activityId) || !isNonEmptyString(value.type)) return null;

  const base = {
    schemaVersion: KANI_SCHEMA_VERSION,
    launchId: value.launchId,
    activityId: value.activityId,
  } as const;

  if (value.type === 'kani.activity.ready') return { ...base, type: value.type };
  if (!isObject(value.payload)) return null;

  switch (value.type) {
    case 'kani.activity.launch': {
      const payload = value.payload;
      if (!isNonEmptyString(payload.studentId) || !isNonEmptyString(payload.activityType) || !activityTypes.has(payload.activityType as KaniActivityType)) return null;
      const difficulty = isNonEmptyString(payload.difficulty) ? payload.difficulty : 'none';
      if (!difficulties.has(difficulty as KaniDifficulty)) return null;
      if (!Array.isArray(payload.skillIds) || !payload.skillIds.every(isNonEmptyString)) return null;
      return {
        ...base,
        type: value.type,
        payload: {
          studentId: payload.studentId,
          activityType: payload.activityType as KaniActivityType,
          ...(isNonEmptyString(payload.subjectId) ? { subjectId: payload.subjectId } : {}),
          ...(isNonEmptyString(payload.topicId) ? { topicId: payload.topicId } : {}),
          ...(isNonEmptyString(payload.pageId) ? { pageId: payload.pageId } : {}),
          skillIds: payload.skillIds as string[],
          difficulty: difficulty as KaniDifficulty,
        },
      };
    }
    case 'kani.activity.started':
      if (!isNonEmptyString(value.payload.studentId) || !isIsoDateTime(value.payload.startedAt)) return null;
      return { ...base, type: value.type, payload: { studentId: value.payload.studentId, startedAt: value.payload.startedAt } };
    case 'kani.activity.completed': {
      const payload = value.payload;
      if (!isNonEmptyString(payload.studentId) || !isNonEmptyString(payload.attemptId)) return null;
      if (!isNonEmptyString(payload.activityType) || !activityTypes.has(payload.activityType as KaniActivityType)) return null;
      const difficulty = isNonEmptyString(payload.difficulty) ? payload.difficulty : 'none';
      if (!difficulties.has(difficulty as KaniDifficulty)) return null;
      if (!Array.isArray(payload.skillIds) || !payload.skillIds.every(isNonEmptyString)) return null;
      if (!isIsoDateTime(payload.completedAt)) return null;
      if (payload.accuracy !== undefined && (typeof payload.accuracy !== 'number' || payload.accuracy < 0 || payload.accuracy > 1)) return null;
      return {
        ...base,
        type: value.type,
        payload: {
          studentId: payload.studentId,
          attemptId: payload.attemptId,
          activityType: payload.activityType as KaniActivityType,
          ...(typeof payload.correct === 'number' ? { correct: payload.correct } : {}),
          ...(typeof payload.total === 'number' ? { total: payload.total } : {}),
          ...(typeof payload.accuracy === 'number' ? { accuracy: payload.accuracy } : {}),
          ...(typeof payload.score === 'number' ? { score: payload.score } : {}),
          ...(typeof payload.durationSeconds === 'number' ? { durationSeconds: payload.durationSeconds } : {}),
          difficulty: difficulty as KaniDifficulty,
          skillIds: payload.skillIds as string[],
          completedAt: payload.completedAt,
        },
      };
    }
    case 'kani.activity.cancelled':
      if (!isIsoDateTime(value.payload.cancelledAt)) return null;
      return {
        ...base,
        type: value.type,
        payload: {
          ...(isNonEmptyString(value.payload.studentId) ? { studentId: value.payload.studentId } : {}),
          cancelledAt: value.payload.cancelledAt,
        },
      };
    case 'kani.activity.error':
      if (!isNonEmptyString(value.payload.code) || !isNonEmptyString(value.payload.message)) return null;
      return { ...base, type: value.type, payload: { code: value.payload.code, message: value.payload.message } };
    default:
      return null;
  }
}

export function createLaunchMessage(context: KaniLaunchContext): KaniActivityMessage {
  if (!context.launchId.trim() || !context.activityId.trim() || !context.studentId.trim()) {
    throw new Error('launchId, activityId and studentId are required');
  }
  return {
    schemaVersion: KANI_SCHEMA_VERSION,
    type: 'kani.activity.launch',
    launchId: context.launchId,
    activityId: context.activityId,
    payload: {
      studentId: context.studentId,
      activityType: context.activityType,
      ...(context.subjectId ? { subjectId: context.subjectId } : {}),
      ...(context.topicId ? { topicId: context.topicId } : {}),
      ...(context.pageId ? { pageId: context.pageId } : {}),
      skillIds: [...(context.skillIds || [])],
      difficulty: context.difficulty || 'none',
    },
  };
}

export function postKaniActivityMessage(targetWindow: Pick<Window, 'postMessage'>, targetOrigin: string, message: KaniActivityMessage) {
  if (!targetOrigin || targetOrigin === '*') throw new Error('Explicit targetOrigin is required');
  const normalizedOrigin = new URL(targetOrigin).origin;
  targetWindow.postMessage(message, normalizedOrigin);
}

export function acceptKaniActivityEvent(options: {
  event: Pick<MessageEvent, 'origin' | 'source' | 'data'>;
  allowedOrigins: readonly string[];
  expectedSource?: MessageEventSource | null;
  launchId: string;
  activityId: string;
  studentId?: string;
}): KaniBridgeAcceptResult {
  const allowed = normalizeAllowedOrigins(options.allowedOrigins);
  if (!allowed.includes(options.event.origin)) return { accepted: false, reason: 'origin_not_allowed' };
  if (options.expectedSource && options.event.source !== options.expectedSource) return { accepted: false, reason: 'source_mismatch' };
  const message = parseKaniActivityMessage(options.event.data);
  if (!message) return { accepted: false, reason: 'invalid_message' };
  if (message.launchId !== options.launchId) return { accepted: false, reason: 'launch_mismatch' };
  if (message.activityId !== options.activityId) return { accepted: false, reason: 'activity_mismatch' };
  if (options.studentId && 'payload' in message && 'studentId' in message.payload && message.payload.studentId && message.payload.studentId !== options.studentId) {
    return { accepted: false, reason: 'student_mismatch' };
  }
  return { accepted: true, message };
}
