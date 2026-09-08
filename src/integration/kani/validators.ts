import {
  KANI_SCHEMA_VERSION,
  KaniActivityType,
  KaniAttemptV1,
  KaniCatalogPage,
  KaniCatalogSubject,
  KaniCatalogTopic,
  KaniCatalogV1,
  KaniDifficulty,
  KaniQuestion,
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

function requireBoolean(value: unknown, context: string): boolean {
  if (typeof value !== 'boolean') throw new KaniContractError(`${context} must be boolean`);
  return value;
}

function requireFiniteNumber(value: unknown, context: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new KaniContractError(`${context} must be finite`);
  return value;
}

function requireInteger(value: unknown, context: string): number {
  const numeric = requireFiniteNumber(value, context);
  if (!Number.isInteger(numeric)) throw new KaniContractError(`${context} must be an integer`);
  return numeric;
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
  if (item.learnerUrl !== undefined) page.learnerUrl = requireString(item.learnerUrl, `catalog.pages[${index}].learnerUrl`);
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

function parseQuestionBase(item: Record<string, unknown>) {
  assertSchemaVersion(item.schemaVersion, 'question');
  const base = {
    schemaVersion: KANI_SCHEMA_VERSION,
    id: requireString(item.id, 'question.id'),
    skillIds: requireStringArray(item.skillIds, 'question.skillIds'),
    conceptTags: requireStringArray(item.conceptTags, 'question.conceptTags'),
    difficulty: requireDifficulty(item.difficulty, 'question.difficulty'),
    curriculumTags: requireStringArray(item.curriculumTags, 'question.curriculumTags'),
  };
  return {
    ...base,
    ...(item.subjectId !== undefined ? { subjectId: requireString(item.subjectId, 'question.subjectId') } : {}),
    ...(item.topicId !== undefined ? { topicId: requireString(item.topicId, 'question.topicId') } : {}),
    ...(item.pageId !== undefined ? { pageId: requireString(item.pageId, 'question.pageId') } : {}),
    ...(item.grade !== undefined ? { grade: requireString(item.grade, 'question.grade') } : {}),
    ...(item.cognitiveDemand !== undefined ? { cognitiveDemand: requireString(item.cognitiveDemand, 'question.cognitiveDemand') } : {}),
    ...(item.hint !== undefined ? { hint: requireString(item.hint, 'question.hint') } : {}),
    ...(item.explanation !== undefined ? { explanation: requireString(item.explanation, 'question.explanation') } : {}),
  };
}

function requireIndex(value: unknown, length: number, context: string): number {
  const index = requireInteger(value, context);
  if (index < 0 || index >= length) throw new KaniContractError(`${context} is out of range`);
  return index;
}

function requireIndexArray(value: unknown, length: number, context: string): number[] {
  if (!Array.isArray(value) || value.length === 0) throw new KaniContractError(`${context} must be a non-empty array`);
  const indexes = value.map((entry, index) => requireIndex(entry, length, `${context}[${index}]`));
  if (new Set(indexes).size !== indexes.length) throw new KaniContractError(`${context} must contain unique indexes`);
  return indexes;
}

function parseMatchingItems(value: unknown, context: string): Array<{ id: string; text: string }> {
  if (!Array.isArray(value) || value.length < 2) throw new KaniContractError(`${context} must contain at least two items`);
  const items = value.map((entry, index) => {
    const item = requireObject(entry, `${context}[${index}]`);
    return { id: requireString(item.id, `${context}[${index}].id`), text: requireString(item.text, `${context}[${index}].text`) };
  });
  assertUniqueIds(items, context);
  return items;
}

function parseCorrectPairs(value: unknown, leftIds: Set<string>, rightIds: Set<string>) {
  if (!Array.isArray(value) || value.length === 0) throw new KaniContractError('question.correctPairs must be non-empty');
  const pairs: Array<[string, string]> = value.map((entry, index) => {
    if (!Array.isArray(entry) || entry.length !== 2) throw new KaniContractError(`question.correctPairs[${index}] must contain two ids`);
    const left = requireString(entry[0], `question.correctPairs[${index}][0]`);
    const right = requireString(entry[1], `question.correctPairs[${index}][1]`);
    if (!leftIds.has(left) || !rightIds.has(right)) throw new KaniContractError(`question.correctPairs[${index}] references an unknown item`);
    return [left, right];
  });
  if (new Set(pairs.map(([left]) => left)).size !== pairs.length) throw new KaniContractError('question.correctPairs must map each left item once');
  return pairs;
}

function parseAcceptedBlankAnswers(value: unknown): Array<string | number> {
  if (!Array.isArray(value) || value.length === 0) throw new KaniContractError('question.acceptedAnswers must be non-empty');
  return value.map((entry, index) => {
    if (typeof entry === 'number' && Number.isFinite(entry)) return entry;
    return requireString(entry, `question.acceptedAnswers[${index}]`);
  });
}

export function parseKaniQuestion(value: unknown): KaniQuestion {
  const item = requireObject(value, 'question');
  const base = parseQuestionBase(item);
  const type = requireString(item.type, 'question.type');

  if (type === 'mcq') {
    const options = requireStringArray(item.options, 'question.options');
    if (options.length < 2) throw new KaniContractError('question.options must contain at least two choices');
    return { ...base, type, prompt: requireString(item.prompt, 'question.prompt'), options, answerIndex: requireIndex(item.answerIndex, options.length, 'question.answerIndex') };
  }
  if (type === 'multi_select') {
    const options = requireStringArray(item.options, 'question.options');
    if (options.length < 2) throw new KaniContractError('question.options must contain at least two choices');
    return { ...base, type, prompt: requireString(item.prompt, 'question.prompt'), options, answerIndexes: requireIndexArray(item.answerIndexes, options.length, 'question.answerIndexes') };
  }
  if (type === 'true_false') {
    return { ...base, type, prompt: requireString(item.prompt, 'question.prompt'), answer: requireBoolean(item.answer, 'question.answer') };
  }
  if (type === 'short_answer') {
    const acceptedAnswers = requireStringArray(item.acceptedAnswers, 'question.acceptedAnswers');
    if (acceptedAnswers.length === 0) throw new KaniContractError('question.acceptedAnswers must be non-empty');
    return { ...base, type, prompt: requireString(item.prompt, 'question.prompt'), acceptedAnswers, caseSensitive: requireBoolean(item.caseSensitive, 'question.caseSensitive') };
  }
  if (type === 'numeric') {
    const tolerance = requireFiniteNumber(item.tolerance, 'question.tolerance');
    if (tolerance < 0) throw new KaniContractError('question.tolerance must be non-negative');
    return {
      ...base,
      type,
      prompt: requireString(item.prompt, 'question.prompt'),
      answer: requireFiniteNumber(item.answer, 'question.answer'),
      tolerance,
      ...(item.unit !== undefined ? { unit: requireString(item.unit, 'question.unit') } : {}),
    };
  }
  if (type === 'fill_in_blank') {
    return {
      ...base,
      type,
      prompt: requireString(item.prompt, 'question.prompt'),
      acceptedAnswers: parseAcceptedBlankAnswers(item.acceptedAnswers),
      caseSensitive: requireBoolean(item.caseSensitive, 'question.caseSensitive'),
    };
  }
  if (type === 'match_following') {
    const leftItems = parseMatchingItems(item.leftItems, 'question.leftItems');
    const rightItems = parseMatchingItems(item.rightItems, 'question.rightItems');
    return {
      ...base,
      type,
      prompt: requireString(item.prompt, 'question.prompt'),
      leftItems,
      rightItems,
      correctPairs: parseCorrectPairs(item.correctPairs, new Set(leftItems.map(({ id }) => id)), new Set(rightItems.map(({ id }) => id))),
    };
  }
  if (type === 'assertion_reason') {
    const options = requireStringArray(item.options, 'question.options');
    if (options.length < 2) throw new KaniContractError('question.options must contain at least two choices');
    return {
      ...base,
      type,
      assertion: requireString(item.assertion, 'question.assertion'),
      reason: requireString(item.reason, 'question.reason'),
      options,
      answerIndex: requireIndex(item.answerIndex, options.length, 'question.answerIndex'),
    };
  }
  if (type === 'sequence_order') {
    const items = requireStringArray(item.items, 'question.items');
    if (items.length < 2) throw new KaniContractError('question.items must contain at least two items');
    const correctOrder = requireIndexArray(item.correctOrder, items.length, 'question.correctOrder');
    if (correctOrder.length !== items.length) throw new KaniContractError('question.correctOrder must include every item');
    return { ...base, type, prompt: requireString(item.prompt, 'question.prompt'), items, correctOrder };
  }
  if (type === 'long_answer') {
    return { ...base, type, prompt: requireString(item.prompt, 'question.prompt'), modelAnswer: requireString(item.modelAnswer, 'question.modelAnswer') };
  }
  if (type === 'diagram_label') {
    const answerMap = requireObject(item.answerMap, 'question.answerMap');
    const parsedAnswerMap = Object.fromEntries(Object.entries(answerMap).map(([key, answer]) => [key, requireString(answer, `question.answerMap.${key}`)]));
    return { ...base, type, prompt: requireString(item.prompt, 'question.prompt'), labels: requireStringArray(item.labels, 'question.labels'), answerMap: parsedAnswerMap };
  }
  if (type === 'interactive_external') {
    const externalRef = requireObject(item.externalRef, 'question.externalRef');
    const parsedExternalRef = {
      ...externalRef,
      activityId: requireString(externalRef.activityId, 'question.externalRef.activityId'),
      launchUrl: requireString(externalRef.launchUrl, 'question.externalRef.launchUrl'),
    };
    return {
      ...base,
      type,
      ...(item.prompt !== undefined ? { prompt: requireString(item.prompt, 'question.prompt') } : {}),
      externalRef: parsedExternalRef,
    };
  }

  throw new KaniContractError(`question.type is unsupported: ${type}`);
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
