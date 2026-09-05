import { KANI_SCHEMA_VERSION, KaniAttemptV1, KaniQuestion } from '../../integration/kani/contracts';
import { evaluateQuestionAnswer } from './AnswerEvaluator';
import { buildQuestionReviewEvidence } from './reviewEvidence';
import { selectSessionQuestions } from './sessionSelection';
import {
  QuestionSessionConfig,
  QuestionSessionContext,
  QuestionSessionResult,
  QuestionSessionSnapshot,
  SupportedAnswer,
} from './types';

type Clock = () => number;

function createSessionId(): string {
  if (globalThis.crypto?.randomUUID) return `session_${globalThis.crypto.randomUUID()}`;
  return `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export class QuestionSessionEngine {
  private readonly questions: KaniQuestion[];
  private readonly sessionId: string;
  private readonly clock: Clock;
  private readonly startedAtMs: number;
  private currentStartedAtMs: number;
  private currentIndexValue = 0;
  private readonly responsesValue: QuestionSessionSnapshot['responses'] = [];

  constructor(options: {
    questions: readonly KaniQuestion[];
    config: QuestionSessionConfig;
    random?: () => number;
    clock?: Clock;
  }) {
    this.clock = options.clock || Date.now;
    this.sessionId = options.config.sessionId || createSessionId();
    this.questions = selectSessionQuestions(options.questions, options.config, options.random);
    this.startedAtMs = this.clock();
    this.currentStartedAtMs = this.startedAtMs;
  }

  get currentQuestion(): KaniQuestion | null {
    return this.questions[this.currentIndexValue] || null;
  }

  get completed(): boolean {
    return this.questions.length === 0 || this.currentIndexValue >= this.questions.length;
  }

  get currentIndex(): number {
    return this.currentIndexValue;
  }

  getSnapshot(): QuestionSessionSnapshot {
    return {
      sessionId: this.sessionId,
      questions: [...this.questions],
      currentIndex: this.currentIndexValue,
      responses: this.responsesValue.map((response) => ({ ...response })),
      completed: this.completed,
      startedAt: new Date(this.startedAtMs).toISOString(),
    };
  }

  submitAnswer(answer: SupportedAnswer, hintsUsed = 0) {
    const question = this.currentQuestion;
    if (!question) throw new Error('Question session is already complete');
    const evaluation = evaluateQuestionAnswer(question, answer);
    if (!evaluation.supported) throw new Error(`Question type ${question.type} is not supported by this runtime yet`);

    const completedAtMs = this.clock();
    const response = {
      questionId: question.id,
      questionType: question.type,
      answer: evaluation.normalizedAnswer,
      correct: evaluation.correct,
      partialCredit: evaluation.partialCredit,
      responseTimeMs: Math.max(0, completedAtMs - this.currentStartedAtMs),
      hintsUsed: Math.max(0, Math.floor(hintsUsed)),
      startedAt: new Date(this.currentStartedAtMs).toISOString(),
      completedAt: new Date(completedAtMs).toISOString(),
    };
    this.responsesValue.push(response);
    this.currentIndexValue += 1;
    this.currentStartedAtMs = completedAtMs;
    return { response: { ...response }, evaluation };
  }

  buildResult(context: QuestionSessionContext): QuestionSessionResult {
    if (!context.studentId.trim()) throw new Error('studentId is required to build canonical attempts');
    if (!context.activityId.trim()) throw new Error('activityId is required to build canonical attempts');

    const questionById = new Map(this.questions.map((question) => [question.id, question]));
    const attempts: KaniAttemptV1[] = this.responsesValue.flatMap((response) => {
      const question = questionById.get(response.questionId);
      if (!question) return [];
      return [{
        schemaVersion: KANI_SCHEMA_VERSION,
        attemptId: `${this.sessionId}:${response.questionId}`,
        studentId: context.studentId,
        activityId: context.activityId,
        activityType: context.activityType,
        sourceApp: context.sourceApp || 'game-app',
        subjectId: context.subjectId || question.subjectId,
        topicId: context.topicId || question.topicId,
        pageId: context.pageId || question.pageId,
        questionId: question.id,
        skillIds: [...question.skillIds],
        difficulty: question.difficulty,
        correct: response.correct,
        partialCredit: response.partialCredit,
        responseTimeMs: response.responseTimeMs,
        hintsUsed: response.hintsUsed,
        startedAt: response.startedAt,
        completedAt: response.completedAt,
      }];
    });

    const correctCount = this.responsesValue.filter((response) => response.correct).length;
    const total = this.responsesValue.length;
    return {
      attempts,
      review: buildQuestionReviewEvidence(this.questions, this.responsesValue),
      correctCount,
      total,
      accuracy: total === 0 ? 0 : correctCount / total,
      totalResponseTimeMs: this.responsesValue.reduce((sum, response) => sum + response.responseTimeMs, 0),
    };
  }
}
