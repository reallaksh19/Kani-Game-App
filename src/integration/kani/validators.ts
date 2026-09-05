import {
  KANI_SCHEMA_VERSION,
  KaniActivityType,
  KaniAttemptV1,
  KaniCatalogPage,
  KaniCatalogSubject,
  KaniCatalogTopic,
  KaniCatalogV1,
  KaniDifficulty,
  KaniSourceApp,
  StudyHubPageDocument,
} from './contracts';

export class KaniContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KaniContractError';
  }
}

const DIFFICULTIES = new Set<KaniDifficulty>(['easy', 'medium', 'hard', 'mixed', 'none']);
const ACTIVITY_TYPES = new Set<KaniActivityType>(['lesson', 'worksheet', 'quiz', 'game', 'brain', 'challenge', 'interactive']);
const SOURCE_APPS = new Set<KaniSourceApp>(['study-hub', 'game-app', 'worksheet-app']);

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(isNonEmptyString);
const isOptionalFiniteNumber = (value: unknown): value is number | undefined => value === undefined || (typeof value === 'number' && Number.isFinite(value));
const isIsoDateTime = (value: unknown): value is string => isNonEmptyString(value) && value.includes('T') && !Number.isNaN(Date.parse(value));

function requireObject(value: unknown, context: string): Record<string, unknown> {
  if (!isObject(value)) throw new KaniContractError(`${context} must be an object`);
  return value;
}

function requireString(value: unknown, context: string): string {
  if (!isNonEmptyString(value)) throw new KaniContractError(`${context} must be a non-empty string`);
  return value;
}

function requireDifficulty(value: unknown, context: string): KaniDifficulty {
  if (!isNonEmptyString(value) || !DIFFICULTIES.has(value as KaniDifficulty)) {
    throw new KaniContractError(`${context} must be one of ${[...DIFFICULTIES].join(', ')}`);
  }
  return value as KaniDifficulty;
}

function requireActivityType(value: unknown, context: string): KaniActivityType {
  if (!isNonEmptyString(value) || !ACTIVITY_TYPES.has(value as KaniActivityType)) {
    throw new KaniContractError(`${context} must be a supported activity type`);
  }
  return value as KaniActivityType;
}

function requireStringArray(value: unknown, context: string): string[] {
  if (!isStringArray(value)) throw new KaniContractError(`${context} must be an array of non-empty strings`);
  return value;
}

function assertSchemaVersion(value: unknown, context: string) {
  if (value !== KANI_SCHEMA_VERSION) throw new KaniContractError(`${context}.schemaVersion must equal ${KANI_SCHEMA_VERSION}`);
}

function validateSubject(value: unknown, index: number): KaniCatalogSubject {
  const item = requireObject(value, `catalog.subjects[${index}]`);
  const subject: KaniCatalogSubject = {
    id: requireString(item.id, `catalog.subjects[${index}].id`),
    title: requireString(item.title, `catalog.subjects[${index}].title`),
  };
  if (item.grade !== undefined) subject.grade = requireString(item.grade, `catalog.subjects[${index}].grade`);
  if (!isOptionalFiniteNumber(item.order)) throw new KaniContractError(`catalog.subjects[${index}].order must be finite`);
  if (typeof item.order === 'number') subject.order = item.order;
  return subject;
}

function validateTopic(value: unknown, index: number): KaniCatalogTopic {
  const item = requireObject(value, `catalog.topics[${index}]`);
  const topic: KaniCatalogTopic = {
    id: requireString(item.id, `catalog.topics[${index}].id`),
    subjectId: requireString(item.subjectId, `catalog.topics[${index}].subjectId`),
    title: requireString(item.title, `catalog.topics[${index}].title`),
    difficulty: requireDifficulty(item.difficulty, `catalog.topics[${index}].difficulty`),
    conceptTags: requireStringArray(item.conceptTags, `catalog.topics[${index}].conceptTags`),
    pageRefs: requireStringArray(item.pageRefs, `catalog.topics[${index}].pageRefs`),
  };
  if (item.grade !== undefined) topic.grade = requireString(item.grade, `catalog.topics[${index}].grade`);
  if (!isOptionalFiniteNumber(item.order)) throw new KaniContractError(`catalog.topics[${index}].order must be finite`);
  if (typeof item.order === 'number') topic.order = item.order;
  return topic;
}

function validatePage(value: unknown, index: number): KaniCatalogPage {
  const item = requireObject(value, `catalog.pages[${index}]`);
  const page: KaniCatalogPage = {
    id: requireString(item.id, `catalog.pages[${index}].id`),
    topicId: requireString(item.topicId, `catalog.pages[${index}].topicId`),
    subjectId: requireString(item.subjectId, `catalog.pages[${index}].subjectId`),
    title: requireString(item.title, `catalog.pages[${index}].title`),
    activityType: requireActivityType(item.activityType, `catalog.pages[${index}].activityType`),
    contentUrl: requireString(item.contentUrl, `catalog.pages[${index}].contentUrl`),
    difficulty: requireDifficulty(item.difficulty, `catalog.pages[${index}].difficulty`),
    skillIds: requireStringArray(item.skillIds, `catalog.pages[${index}].skillIds`),
    conceptTags: requireStringArray(item.conceptTags, `catalog.pages[${index}].conceptTags`),
  };
  if (item.grade !== undefined) page.grade = requireString(item.grade, `catalog.pages[${index}].grade`);
  if (!isOptionalFiniteNumber(item.order)) throw new KaniContractError(`catalog.pages[${index}].order must be finite`);
  if (typeof item.order === 'number') page.order = item.order;
  return page;
}

function assertUniqueIds(items: Array<{ id: string }>, context: string) {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) throw new KaniContractError(`${context} contains duplicate id ${item.id}`);
    seen.add(item.id);
  }
}

export function parseKaniCatalog(value: unknown): KaniCatalogV1 {
  const catalog = requireObject(value, 'catalog');
  assertSchemaVersion(catalog.schemaVersion, 'catalog');
  if (catalog.sourceApp !== 'study-hub') throw new KaniContractError('catalog.sourceApp must be study-hub');
  if (!isIsoDateTime(catalog.publishedAt)) throw new KaniContractError('catalog.publishedAt must be ISO-8601');
  if (!Array.isArray(catalog.subjects) || !Array.isArray(catalog.topics) || !Array.isArray(catalog.pages)) {
    throw new KaniContractError('catalog subjects/topics/pages must be arrays');
  }

  const subjects = catalog.subjects.map(validateSubject);
  const topics = catalog.topics.map(validateTopic);
  const pages = catalog.pages.map(validatePage);
  assertUniqueIds(subjects, 'catalog.subjects');
  assertUniqueIds(topics, 'catalog.topics');
  assertUniqueIds(pages, 'catalog.pages');

  const subjectIds = new Set(subjects.map((item) => item.id));
  const topicIds = new Set(topics.map((item) => item.id));
  const pageIds = new Set(pages.map((item) => item.id));
  for (const topic of topics) {
    if (!subjectIds.has(topic.subjectId)) throw new KaniContractError(`topic ${topic.id} references missing subject ${topic.subjectId}`);
    for (const pageId of topic.pageRefs) {
      if (!pageIds.has(pageId)) throw new KaniContractError(`topic ${topic.id} references missing page ${pageId}`);
    }
  }
  for (const page of pages) {
    if (!topicIds.has(page.topicId)) throw new KaniContractError(`page ${page.id} references missing topic ${page.topicId}`);
    if (!subjectIds.has(page.subjectId)) throw new KaniContractError(`page ${page.id} references missing subject ${page.subjectId}`);
  }

  return {
    schemaVersion: KANI_SCHEMA_VERSION,
    publishedAt: catalog.publishedAt as string,
    sourceApp: 'study-hub',
    subjects,
    topics,
    pages,
  };
}

export function parseStudyHubPageDocument(value: unknown, expected?: { id?: string; topicId?: string }): StudyHubPageDocument {
  const page = requireObject(value, 'Study-Hub page');
  const id = requireString(page.id, 'Study-Hub page.id');
  const topicId = requireString(page.topicId, 'Study-Hub page.topicId');
  const title = requireString(page.title, 'Study-Hub page.title');
  if (expected?.id && id !== expected.id) throw new KaniContractError(`Study-Hub page id mismatch: expected ${expected.id}, got ${id}`);
  if (expected?.topicId && topicId !== expected.topicId) throw new KaniContractError(`Study-Hub topic id mismatch: expected ${expected.topicId}, got ${topicId}`);
  return { ...page, id, topicId, title } as StudyHubPageDocument;
}

export function assertKaniAttempt(value: unknown): asserts value is KaniAttemptV1 {
  const attempt = requireObject(value, 'attempt');
  assertSchemaVersion(attempt.schemaVersion, 'attempt');
  requireString(attempt.attemptId, 'attempt.attemptId');
  requireString(attempt.studentId, 'attempt.studentId');
  requireString(attempt.activityId, 'attempt.activityId');
  requireActivityType(attempt.activityType, 'attempt.activityType');
  if (!isNonEmptyString(attempt.sourceApp) || !SOURCE_APPS.has(attempt.sourceApp as KaniSourceApp)) {
    throw new KaniContractError('attempt.sourceApp must be a supported source app');
  }
  requireDifficulty(attempt.difficulty, 'attempt.difficulty');
  requireStringArray(attempt.skillIds, 'attempt.skillIds');
  if (attempt.partialCredit !== undefined && (typeof attempt.partialCredit !== 'number' || attempt.partialCredit < 0 || attempt.partialCredit > 1)) {
    throw new KaniContractError('attempt.partialCredit must be between 0 and 1');
  }
  for (const key of ['responseTimeMs', 'hintsUsed'] as const) {
    const numeric = attempt[key];
    if (numeric !== undefined && (typeof numeric !== 'number' || numeric < 0 || !Number.isFinite(numeric))) {
      throw new KaniContractError(`attempt.${key} must be a non-negative finite number`);
    }
  }
  if (attempt.score !== undefined && (typeof attempt.score !== 'number' || !Number.isFinite(attempt.score))) {
    throw new KaniContractError('attempt.score must be finite');
  }
  if (!isIsoDateTime(attempt.completedAt)) throw new KaniContractError('attempt.completedAt must be ISO-8601');
  if (attempt.startedAt !== undefined && !isIsoDateTime(attempt.startedAt)) throw new KaniContractError('attempt.startedAt must be ISO-8601');
}

export function normalizeKaniDifficulty(value: string | undefined | null): KaniDifficulty {
  if (!value) return 'none';
  const normalized = value.trim().toLowerCase();
  if (DIFFICULTIES.has(normalized as KaniDifficulty)) return normalized as KaniDifficulty;
  throw new KaniContractError(`Unsupported difficulty ${value}`);
}
