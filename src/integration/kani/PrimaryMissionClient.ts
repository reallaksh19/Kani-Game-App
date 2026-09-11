import { KaniQuestion } from './contracts';
import { KaniContractError, parseKaniQuestion } from './validators';
import type { KaniFetch } from './StudyHubContentClient';

export const PRIMARY_MISSION_RESOLVER_PATH = '/primary/missions/resolver.json';

export interface PrimaryMissionRoute {
  missionId: string;
  renderer: string;
  missionPath: string;
  contentPath: string;
  returnTaskPath: string;
  delayedRetrievalTaskPath: string;
}

export interface PrimaryMissionSemanticRef {
  semanticAuthority: 'reallaksh19/Common';
  semanticVersion: '1.0';
  sourceCommit: string;
  schemaPath: 'Primary/Architecture/contracts/v1/primary-learning-semantics.schema.json';
  schemaGitBlobSha: string;
}

export interface PrimaryMissionV1 {
  transportVersion: '1.0';
  semanticRef: PrimaryMissionSemanticRef;
  missionId: string;
  learningEpisodeId: string;
  learningObjectIds: string[];
  purposeRef: string;
  evidenceGoalRefs: string[];
  questionRefs: Array<{ questionId: string }>;
  rendererPreferences?: string[];
  supportPolicy: {
    startingConceptualSupportLevel: string;
    allowAccessAdjustments: boolean;
  };
  timerPolicy: 'OFF' | 'OPTIONAL' | 'ON';
  launchPolicy: { gate: 'ATTEMPT_NOT_SCORE' };
  completionPolicy: { means: 'ACTIVITY_COMPLETED'; minimumAttempts?: number };
  returnPolicy: {
    required: true;
    activityId: string;
    endlessGameChain: false;
  };
}

export interface PrimaryMissionTaskRef {
  activityId: string;
  learningEpisodeId: string;
  learningObjectIds: string[];
  questionId: string;
  [key: string]: unknown;
}

export interface PrimaryMissionBundle {
  opaqueId: string;
  route: PrimaryMissionRoute;
  mission: PrimaryMissionV1;
  questions: KaniQuestion[];
  returnTask: PrimaryMissionTaskRef;
  delayedRetrievalTask: PrimaryMissionTaskRef & { status: string; earliestDays: number; latestDays: number };
}

export class PrimaryMissionError extends Error {
  readonly status?: number;
  readonly url?: string;
  readonly cause?: unknown;

  constructor(message: string, options?: { status?: number; url?: string; cause?: unknown }) {
    super(message);
    this.name = 'PrimaryMissionError';
    this.status = options?.status;
    this.url = options?.url;
    this.cause = options?.cause;
  }
}

const FORBIDDEN_MISSION_KEYS = new Set([
  'studentId',
  'answer',
  'answerIndex',
  'correctAnswer',
  'mastery',
  'masteryScore',
  'masteryState',
  'childProfile',
  'skillState',
  'currentLearningState',
  'diagnosis',
  'teacherDecision',
  'teacherMove',
  'nextLearningAction',
  'explanation',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function string(value: unknown, context: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new PrimaryMissionError(`${context} must be a non-empty string`);
  return value.trim();
}

function stringArray(value: unknown, context: string): string[] {
  if (!Array.isArray(value) || value.length === 0) throw new PrimaryMissionError(`${context} must be a non-empty string array`);
  return value.map((item, index) => string(item, `${context}[${index}]`));
}

function bool(value: unknown, context: string): boolean {
  if (typeof value !== 'boolean') throw new PrimaryMissionError(`${context} must be boolean`);
  return value;
}

function findForbiddenKey(value: unknown, path: string[] = []): string | null {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = findForbiddenKey(value[index], [...path, String(index)]);
      if (found) return found;
    }
    return null;
  }
  if (!isRecord(value)) return null;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_MISSION_KEYS.has(key)) return [...path, key].join('.');
    const found = findForbiddenKey(child, [...path, key]);
    if (found) return found;
  }
  return null;
}

function normalizeBaseUrl(value: string): string {
  const normalized = value.trim().replace(/\/+$/, '');
  if (!normalized) throw new PrimaryMissionError('Study-Hub base URL is required');
  return normalized;
}

function joinBaseUrl(baseUrl: string, contentPath: string): string {
  if (/^https?:\/\//i.test(contentPath)) return contentPath;
  return `${baseUrl}/${contentPath.replace(/^\/+/, '')}`;
}

function parseRoute(value: unknown, opaqueId: string): PrimaryMissionRoute {
  if (!isRecord(value)) throw new PrimaryMissionError(`Mission resolver entry not found for ${opaqueId}`);
  return {
    missionId: string(value.missionId, 'route.missionId'),
    renderer: string(value.renderer, 'route.renderer'),
    missionPath: string(value.missionPath, 'route.missionPath'),
    contentPath: string(value.contentPath, 'route.contentPath'),
    returnTaskPath: string(value.returnTaskPath, 'route.returnTaskPath'),
    delayedRetrievalTaskPath: string(value.delayedRetrievalTaskPath, 'route.delayedRetrievalTaskPath'),
  };
}

function parseSemanticRef(value: unknown): PrimaryMissionSemanticRef {
  if (!isRecord(value)) throw new PrimaryMissionError('mission.semanticRef must be an object');
  if (value.semanticAuthority !== 'reallaksh19/Common') throw new PrimaryMissionError('mission semantic authority must be reallaksh19/Common');
  if (value.semanticVersion !== '1.0') throw new PrimaryMissionError('mission semantic version must be 1.0');
  if (value.schemaPath !== 'Primary/Architecture/contracts/v1/primary-learning-semantics.schema.json') {
    throw new PrimaryMissionError('mission semantic schema path is unsupported');
  }
  const sourceCommit = string(value.sourceCommit, 'mission.semanticRef.sourceCommit');
  const schemaGitBlobSha = string(value.schemaGitBlobSha, 'mission.semanticRef.schemaGitBlobSha');
  if (!/^[0-9a-f]{40}$/.test(sourceCommit) || !/^[0-9a-f]{40}$/.test(schemaGitBlobSha)) {
    throw new PrimaryMissionError('mission semantic Git references must be 40-character lowercase SHA values');
  }
  return {
    semanticAuthority: 'reallaksh19/Common',
    semanticVersion: '1.0',
    sourceCommit,
    schemaPath: 'Primary/Architecture/contracts/v1/primary-learning-semantics.schema.json',
    schemaGitBlobSha,
  };
}

export function parsePrimaryMission(value: unknown): PrimaryMissionV1 {
  const forbidden = findForbiddenKey(value);
  if (forbidden) throw new PrimaryMissionError(`mission contains forbidden educational/runtime field: ${forbidden}`);
  if (!isRecord(value)) throw new PrimaryMissionError('mission must be an object');
  if (value.transportVersion !== '1.0') throw new PrimaryMissionError('mission.transportVersion must equal 1.0');
  if (!isRecord(value.supportPolicy) || !isRecord(value.launchPolicy) || !isRecord(value.completionPolicy) || !isRecord(value.returnPolicy)) {
    throw new PrimaryMissionError('mission policies are incomplete');
  }
  if (value.launchPolicy.gate !== 'ATTEMPT_NOT_SCORE') throw new PrimaryMissionError('mission launch must be ATTEMPT_NOT_SCORE');
  if (value.completionPolicy.means !== 'ACTIVITY_COMPLETED') throw new PrimaryMissionError('mission completion cannot declare mastery');
  if (value.returnPolicy.required !== true || value.returnPolicy.endlessGameChain !== false) {
    throw new PrimaryMissionError('mission must require a non-game return path');
  }

  if (!Array.isArray(value.questionRefs) || value.questionRefs.length === 0) throw new PrimaryMissionError('mission.questionRefs must be non-empty');
  const questionRefs = value.questionRefs.map((entry, index) => {
    if (!isRecord(entry) || Object.keys(entry).length !== 1 || !('questionId' in entry)) {
      throw new PrimaryMissionError(`mission.questionRefs[${index}] must use a canonical questionId in Phase 3`);
    }
    return { questionId: string(entry.questionId, `mission.questionRefs[${index}].questionId`) };
  });

  const timerPolicy = string(value.timerPolicy, 'mission.timerPolicy');
  if (!['OFF', 'OPTIONAL', 'ON'].includes(timerPolicy)) throw new PrimaryMissionError('mission.timerPolicy is unsupported');

  const minimumAttempts = value.completionPolicy.minimumAttempts;
  if (minimumAttempts !== undefined && (!Number.isInteger(minimumAttempts) || (minimumAttempts as number) <= 0)) {
    throw new PrimaryMissionError('mission.completionPolicy.minimumAttempts must be a positive integer');
  }

  return {
    transportVersion: '1.0',
    semanticRef: parseSemanticRef(value.semanticRef),
    missionId: string(value.missionId, 'mission.missionId'),
    learningEpisodeId: string(value.learningEpisodeId, 'mission.learningEpisodeId'),
    learningObjectIds: stringArray(value.learningObjectIds, 'mission.learningObjectIds'),
    purposeRef: string(value.purposeRef, 'mission.purposeRef'),
    evidenceGoalRefs: stringArray(value.evidenceGoalRefs, 'mission.evidenceGoalRefs'),
    questionRefs,
    ...(Array.isArray(value.rendererPreferences)
      ? { rendererPreferences: value.rendererPreferences.map((item, index) => string(item, `mission.rendererPreferences[${index}]`)) }
      : {}),
    supportPolicy: {
      startingConceptualSupportLevel: string(value.supportPolicy.startingConceptualSupportLevel, 'mission.supportPolicy.startingConceptualSupportLevel'),
      allowAccessAdjustments: bool(value.supportPolicy.allowAccessAdjustments, 'mission.supportPolicy.allowAccessAdjustments'),
    },
    timerPolicy: timerPolicy as 'OFF' | 'OPTIONAL' | 'ON',
    launchPolicy: { gate: 'ATTEMPT_NOT_SCORE' },
    completionPolicy: {
      means: 'ACTIVITY_COMPLETED',
      ...(minimumAttempts !== undefined ? { minimumAttempts: minimumAttempts as number } : {}),
    },
    returnPolicy: {
      required: true,
      activityId: string(value.returnPolicy.activityId, 'mission.returnPolicy.activityId'),
      endlessGameChain: false,
    },
  };
}

function parseTask(value: unknown, context: string): PrimaryMissionTaskRef {
  if (!isRecord(value)) throw new PrimaryMissionError(`${context} must be an object`);
  return {
    ...value,
    activityId: string(value.activityId, `${context}.activityId`),
    learningEpisodeId: string(value.learningEpisodeId, `${context}.learningEpisodeId`),
    learningObjectIds: stringArray(value.learningObjectIds, `${context}.learningObjectIds`),
    questionId: string(value.questionId, `${context}.questionId`),
  };
}

export class PrimaryMissionClient {
  private readonly baseUrl: string;
  private readonly resolverPath: string;
  private readonly fetchFn: KaniFetch;

  constructor(options: { baseUrl: string; resolverPath?: string; fetchFn?: KaniFetch }) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl);
    this.resolverPath = options.resolverPath || PRIMARY_MISSION_RESOLVER_PATH;
    this.fetchFn = options.fetchFn || fetch.bind(globalThis);
  }

  private async fetchJson(contentPath: string): Promise<unknown> {
    const url = joinBaseUrl(this.baseUrl, contentPath);
    let response: Response;
    try {
      response = await this.fetchFn(url, { headers: { Accept: 'application/json' } });
    } catch (cause) {
      throw new PrimaryMissionError(`Study-Hub Primary mission request failed: ${url}`, { url, cause });
    }
    if (!response.ok) throw new PrimaryMissionError(`Study-Hub Primary mission request failed (${response.status}): ${url}`, { status: response.status, url });
    try {
      return await response.json();
    } catch (cause) {
      throw new PrimaryMissionError(`Study-Hub Primary mission response is invalid JSON: ${url}`, { url, cause });
    }
  }

  async loadByOpaqueId(rawOpaqueId: string): Promise<PrimaryMissionBundle> {
    const opaqueId = rawOpaqueId.trim().toUpperCase();
    if (!/^[A-Z0-9]{8}$/.test(opaqueId)) throw new PrimaryMissionError('Primary mission ID must be an 8-character opaque token');

    const resolver = await this.fetchJson(this.resolverPath);
    if (!isRecord(resolver)) throw new PrimaryMissionError('Primary mission resolver must be an object');
    const route = parseRoute(resolver[opaqueId], opaqueId);

    const mission = parsePrimaryMission(await this.fetchJson(route.missionPath));
    if (mission.missionId !== route.missionId) throw new PrimaryMissionError('resolver missionId does not match mission payload');
    if (mission.rendererPreferences?.length && !mission.rendererPreferences.includes(route.renderer)) {
      throw new PrimaryMissionError('resolver renderer is not allowed by the mission');
    }

    const rawContent = await this.fetchJson(route.contentPath);
    if (!isRecord(rawContent) || !Array.isArray(rawContent.questions)) throw new PrimaryMissionError('mission content must expose a questions array');

    const byId = new Map<string, KaniQuestion>();
    for (const rawQuestion of rawContent.questions) {
      try {
        const question = parseKaniQuestion(rawQuestion);
        byId.set(question.id, question);
      } catch (cause) {
        if (cause instanceof KaniContractError) throw new PrimaryMissionError('mission content contains a question that failed the canonical Kani contract', { cause });
        throw cause;
      }
    }

    const questions = mission.questionRefs.map(({ questionId }) => {
      const question = byId.get(questionId);
      if (!question) throw new PrimaryMissionError(`mission references missing canonical question ${questionId}`);
      return question;
    });
    if (questions.length < 4 || questions.length > 6) throw new PrimaryMissionError('Phase-3 mission must contain 4–6 canonical questions');

    const returnTask = parseTask(await this.fetchJson(route.returnTaskPath), 'returnTask');
    const delayedRaw = await this.fetchJson(route.delayedRetrievalTaskPath);
    const delayedBase = parseTask(delayedRaw, 'delayedRetrievalTask');
    if (!isRecord(delayedRaw)) throw new PrimaryMissionError('delayedRetrievalTask must be an object');
    const status = string(delayedRaw.status, 'delayedRetrievalTask.status');
    const earliestDays = delayedRaw.earliestDays;
    const latestDays = delayedRaw.latestDays;
    if (!Number.isInteger(earliestDays) || !Number.isInteger(latestDays) || (earliestDays as number) < 0 || (latestDays as number) < (earliestDays as number)) {
      throw new PrimaryMissionError('delayed retrieval window is invalid');
    }

    for (const task of [returnTask, delayedBase]) {
      if (task.learningEpisodeId !== mission.learningEpisodeId) throw new PrimaryMissionError('task learningEpisodeId does not match mission');
      if (task.learningObjectIds.some((id) => !mission.learningObjectIds.includes(id))) throw new PrimaryMissionError('task learningObjectIds do not match mission');
      if (mission.questionRefs.some((ref) => ref.questionId === task.questionId)) {
        throw new PrimaryMissionError('return/retrieval question must not be leaked into game mission practice');
      }
    }
    if (returnTask.activityId !== mission.returnPolicy.activityId) throw new PrimaryMissionError('mission return activity does not match return task');
    if (status !== 'NOT_YET_TESTED') throw new PrimaryMissionError('delayed retrieval must start as NOT_YET_TESTED');

    return {
      opaqueId,
      route,
      mission,
      questions,
      returnTask,
      delayedRetrievalTask: {
        ...delayedBase,
        status,
        earliestDays: earliestDays as number,
        latestDays: latestDays as number,
      },
    };
  }
}
