import { KaniCatalogPage, KaniDifficulty, KaniQuestion, StudyHubPageDocument } from './contracts';

export interface StudyHubQuestionAdapterIssue {
  questionId?: string;
  type?: string;
  reason: string;
}

export interface StudyHubQuestionAdapterResult {
  questions: KaniQuestion[];
  unsupported: StudyHubQuestionAdapterIssue[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim())
    : [];
}

function normalizeDifficulty(value: unknown, fallback: KaniDifficulty): KaniDifficulty {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return normalized === 'easy' || normalized === 'medium' || normalized === 'hard'
    ? normalized
    : fallback;
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

function answerIndex(answer: unknown, options: string[]): number | null {
  if (typeof answer === 'number' && Number.isInteger(answer) && answer >= 0 && answer < options.length) return answer;
  if (typeof answer !== 'string') return null;

  const trimmed = answer.trim();
  if (/^[A-Za-z]$/.test(trimmed)) {
    const index = trimmed.toUpperCase().charCodeAt(0) - 65;
    if (index >= 0 && index < options.length) return index;
  }

  const normalized = normalizeText(trimmed);
  const matching = options
    .map((option, index) => ({ option: normalizeText(option), index }))
    .filter((entry) => entry.option === normalized);
  return matching.length === 1 ? matching[0].index : null;
}

function trueFalseAnswer(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLocaleLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return null;
}

function acceptedTextAnswers(raw: Record<string, unknown>): string[] {
  const accepted = strings(raw.acceptedAnswers);
  for (const candidate of [raw.modelAnswer, raw.answer]) {
    if (typeof candidate === 'string' && candidate.trim()) accepted.push(candidate.trim());
    if (typeof candidate === 'number' && Number.isFinite(candidate)) accepted.push(String(candidate));
  }
  return dedupe(accepted);
}

function multiAnswerIndexes(value: unknown, options: string[]): number[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const indexes: number[] = [];
  for (const answer of value) {
    const index = answerIndex(answer, options);
    if (index == null) return null;
    indexes.push(index);
  }
  return [...new Set(indexes)];
}

function commonMetadata(raw: Record<string, unknown>, page: StudyHubPageDocument, meta: KaniCatalogPage, id: string) {
  const pageDifficulty = meta.difficulty === 'mixed' || meta.difficulty === 'none' ? 'medium' : meta.difficulty;
  const cognitiveDemand = [raw.questionCategory, raw.category, raw.usage]
    .find((candidate) => typeof candidate === 'string' && candidate.trim()) as string | undefined;
  return {
    schemaVersion: '1.0' as const,
    id,
    subjectId: meta.subjectId,
    topicId: meta.topicId,
    pageId: meta.id,
    ...(meta.grade ? { grade: meta.grade } : {}),
    skillIds: dedupe([...meta.skillIds, ...strings(raw.skillIds)]),
    conceptTags: dedupe([...meta.conceptTags, ...strings(page.conceptTags), ...strings(raw.conceptTags)]),
    difficulty: normalizeDifficulty(raw.difficulty, pageDifficulty),
    ...(cognitiveDemand ? { cognitiveDemand: cognitiveDemand.trim() } : {}),
    curriculumTags: strings(raw.curriculumTags),
    ...(typeof raw.supportHint === 'string' && raw.supportHint.trim()
      ? { hint: raw.supportHint.trim() }
      : typeof raw.hint === 'string' && raw.hint.trim()
        ? { hint: raw.hint.trim() }
        : {}),
    ...(typeof raw.explanation === 'string' && raw.explanation.trim() ? { explanation: raw.explanation.trim() } : {}),
  };
}

export function adaptStudyHubPageQuestions(page: StudyHubPageDocument, meta: KaniCatalogPage): StudyHubQuestionAdapterResult {
  const questions: KaniQuestion[] = [];
  const unsupported: StudyHubQuestionAdapterIssue[] = [];
  const rawQuestions = Array.isArray(page.questions) ? page.questions : [];

  rawQuestions.forEach((value, index) => {
    if (!isRecord(value)) {
      unsupported.push({ reason: `Question ${index + 1} is not an object` });
      return;
    }
    const type = typeof value.type === 'string' ? value.type : undefined;
    const id = typeof value.id === 'string' && value.id.trim() ? value.id.trim() : undefined;
    if (!id) {
      unsupported.push({ type, reason: 'Missing stable question id' });
      return;
    }
    const base = commonMetadata(value, page, meta, id);

    if (type === 'mcq') {
      const prompt = typeof value.prompt === 'string' ? value.prompt.trim() : '';
      const options = strings(value.options);
      const resolved = answerIndex(value.answer, options);
      if (!prompt || options.length < 2 || resolved == null) {
        unsupported.push({ questionId: id, type, reason: 'MCQ requires prompt, at least two options and a valid answer index, letter or exact option text' });
        return;
      }
      questions.push({ ...base, type, prompt, options, answerIndex: resolved });
      return;
    }

    if (type === 'true_false') {
      const prompt = typeof value.prompt === 'string' ? value.prompt.trim() : '';
      const resolved = trueFalseAnswer(value.answer);
      if (!prompt || resolved == null) {
        unsupported.push({ questionId: id, type, reason: 'True/False requires prompt and a boolean or True/False answer' });
        return;
      }
      questions.push({ ...base, type, prompt, answer: resolved });
      return;
    }

    if (type === 'short_answer') {
      const prompt = typeof value.prompt === 'string' ? value.prompt.trim() : '';
      const acceptedAnswers = acceptedTextAnswers(value);
      if (!prompt || acceptedAnswers.length === 0) {
        unsupported.push({ questionId: id, type, reason: 'Short answer requires prompt and answer/modelAnswer/acceptedAnswers' });
        return;
      }
      questions.push({ ...base, type, prompt, acceptedAnswers, caseSensitive: false });
      return;
    }

    if (type === 'fill_in_blank') {
      const prompt = typeof value.prompt === 'string' ? value.prompt.trim() : '';
      const accepted = Array.isArray(value.acceptedAnswers)
        ? value.acceptedAnswers.filter((item): item is string | number => (typeof item === 'string' && item.trim().length > 0) || (typeof item === 'number' && Number.isFinite(item)))
        : (typeof value.answer === 'string' || typeof value.answer === 'number') ? [value.answer] : [];
      if (!prompt || accepted.length === 0) {
        unsupported.push({ questionId: id, type, reason: 'Fill-in-the-blank requires prompt and scalar answer/acceptedAnswers' });
        return;
      }
      questions.push({ ...base, type, prompt, acceptedAnswers: accepted, caseSensitive: false });
      return;
    }

    if (type === 'multi_select') {
      const prompt = typeof value.prompt === 'string' ? value.prompt.trim() : '';
      const options = strings(value.options);
      const resolved = multiAnswerIndexes(Array.isArray(value.answers) ? value.answers : value.answer, options);
      if (!prompt || options.length < 2 || !resolved?.length) {
        unsupported.push({ questionId: id, type, reason: 'Multi-select requires prompt, options and valid answer indexes/letters/option text' });
        return;
      }
      questions.push({ ...base, type, prompt, options, answerIndexes: resolved });
      return;
    }

    unsupported.push({ questionId: id, type, reason: `Question type ${type || '(missing)'} is not enabled in the first-wave Kani runtime` });
  });

  return { questions, unsupported };
}
