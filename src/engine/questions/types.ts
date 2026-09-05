import { KaniActivityType, KaniAttemptV1, KaniDifficulty, KaniQuestion, KaniSourceApp } from '../../integration/kani/contracts';

export type SupportedAnswer = string | number | boolean | number[] | Record<string, string>;

export interface AnswerEvaluation {
  supported: boolean;
  correct: boolean;
  partialCredit: number;
  normalizedAnswer: SupportedAnswer;
  correctAnswer?: unknown;
}

export interface QuestionResponseEvidence {
  questionId: string;
  questionType: KaniQuestion['type'];
  answer: SupportedAnswer;
  correct: boolean;
  partialCredit: number;
  responseTimeMs: number;
  hintsUsed: number;
  startedAt: string;
  completedAt: string;
}

export interface QuestionSessionConfig {
  limit?: number;
  difficulty?: KaniDifficulty;
  randomize: boolean;
  sessionId?: string;
}

export interface QuestionSessionContext {
  studentId: string;
  activityId: string;
  activityType: KaniActivityType;
  sourceApp?: KaniSourceApp;
  subjectId?: string;
  topicId?: string;
  pageId?: string;
}

export interface QuestionSessionSnapshot {
  sessionId: string;
  questions: KaniQuestion[];
  currentIndex: number;
  responses: QuestionResponseEvidence[];
  completed: boolean;
  startedAt: string;
}

export interface QuestionReviewEvidence {
  questionId: string;
  type: KaniQuestion['type'];
  prompt: string;
  selectedAnswer: SupportedAnswer;
  correctAnswer?: unknown;
  correct: boolean;
  partialCredit: number;
  responseTimeMs: number;
  hintsUsed: number;
  explanation?: string;
  hint?: string;
}

export interface QuestionSessionResult {
  attempts: KaniAttemptV1[];
  review: QuestionReviewEvidence[];
  correctCount: number;
  total: number;
  accuracy: number;
  totalResponseTimeMs: number;
}
