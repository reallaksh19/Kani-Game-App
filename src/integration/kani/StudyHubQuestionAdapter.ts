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
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim()) : [];
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

function answerIndex(answer: unknown, optionCount: number): number | null {
  if (typeof answer === 'number' && Number.isInteger(answer) && answer >= 0 && answer < optionCount) return answer;
  if (typeof answer === 'string' && /^[A-Za-z]$/.test(answer.trim())) {
    const index = answer.trim().toUpperCase().charCodeAt(0) - 65;
    return index >= 0 && index < optionCount ? index : null;
  }
  return null;
}

function commonMetadata(raw: Record<string, unknown>, page: StudyHubPageDocument, meta: KaniCatalogPage, id: string) {
  const pageDifficulty = meta.difficulty === 'mixed' || meta.difficulty === 'none' ? 'medium' : meta.difficulty;
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
    ...(typeof raw.questionCategory === 'string' && raw.questionCategory.trim() ? { cognitiveDemand: raw.questionCategory.trim() } : {}),
    curriculumTags: strings(raw.curriculumTags),
    ...(typeof raw.supportHint === 'string' && raw.supportHint.trim() ? { hint: raw.supportHint.trim() } : typeof raw.hint === 'string' && raw.hint.trim() ? { hint: raw.hint.trim() } : {}),
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
      const resolved = answerIndex(value.answer, options.length);
      if (!prompt || options.length < 2 || resolved == null) {
        unsupported.push({ questionId: id, type, reason: 'MCQ requires prompt, at least two options and a valid answer index/letter' });
        return;
      }
      questions.push({ ...base, type, prompt, options, answerIndex: resolved });
      return;
    }

    if (type === 'true_false') {
      const prompt = typeof value.prompt === 'string' ? value.prompt.trim() : '';
      if (!prompt || typeof value.answer !== 'boolean') {
        unsupported.push({ questionId: id, type, reason: 'True/False requires prompt and boolean answer' });
        return;
      }
      questions.push({ ...base, type, prompt, answer: value.answer });
      return;
    }

    if (type === 'short_answer') {
      const prompt = typeof value.prompt === 'string' ? value.prompt.trim() : '';
      const modelAnswer = typeof value.modelAnswer === 'string' ? value.modelAnswer.trim() : '';
      if (!prompt || !modelAnswer) {
        unsupported.push({ questionId: id, type, reason: 'Short answer requires prompt and modelAnswer' });
        return;
      }
      questions.push({ ...base, type, prompt, acceptedAnswers: [modelAnswer], caseSensitive: false });
      return;
    }

    if (type === 'fill_in_blank') {
      const prompt = typeof value.prompt === 'string' ? value.prompt.trim() : '';
      if (!prompt || !['string', 'number'].includes(typeof value.answer)) {
        unsupported.push({ questionId: id, type, reason: 'Fill-in-the-blank requires prompt and scalar answer' });
        return;
      }
      questions.push({ ...base, type, prompt, acceptedAnswers: [value.answer as string | number], caseSensitive: false });
      return;
    }

    if (type === 'multi_select') {
      const prompt = typeof value.prompt === 'string' ? value.prompt.trim() : '';
      const options = strings(value.options);
      const answers = Array.isArray(value.answers)
        ? value.answers.filter((item): item is number => typeof item === 'number' && Number.isInteger(item))
        : [];
      if (!prompt || options.length < 2 || answers.length === 0 || answers.some((item) => item < 0 || item >= options.length)) {
        unsupported.push({ questionId: id, type, reason: 'Multi-select requires prompt, options and valid answer indexes' });
        return;
      }
      questions.push({ ...base, type, prompt, options, answerIndexes: [...new Set(answers)] });
      return;
    }

    unsupported.push({ questionId: id, type, reason: `Question type ${type || '(missing)'} is not enabled in the first-wave Kani runtime` });
  });

  return { questions, unsupported };
}
