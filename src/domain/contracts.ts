export const KANI_SCHEMA_VERSION = '1.0' as const;

export type KaniDifficulty = 'easy' | 'medium' | 'hard' | 'mixed' | 'none';
export type KaniActivityType = 'lesson' | 'worksheet' | 'quiz' | 'game' | 'brain' | 'challenge' | 'interactive';
export type KaniSourceApp = 'study-hub' | 'game-app' | 'worksheet-app';

export interface KaniQuestionBase {
  schemaVersion: typeof KANI_SCHEMA_VERSION;
  id: string;
  subjectId?: string;
  topicId?: string;
  pageId?: string;
  grade?: string;
  skillIds: string[];
  conceptTags: string[];
  difficulty: KaniDifficulty;
  cognitiveDemand?: string;
  curriculumTags: string[];
  hint?: string;
  explanation?: string;
}

export type KaniQuestion =
  | (KaniQuestionBase & { type: 'mcq'; prompt: string; options: string[]; answerIndex: number })
  | (KaniQuestionBase & { type: 'multi_select'; prompt: string; options: string[]; answerIndexes: number[] })
  | (KaniQuestionBase & { type: 'true_false'; prompt: string; answer: boolean })
  | (KaniQuestionBase & { type: 'short_answer'; prompt: string; acceptedAnswers: string[]; caseSensitive: boolean })
  | (KaniQuestionBase & { type: 'numeric'; prompt: string; answer: number; tolerance: number; unit?: string })
  | (KaniQuestionBase & { type: 'fill_in_blank'; prompt: string; acceptedAnswers: Array<string | number>; caseSensitive: boolean })
  | (KaniQuestionBase & {
      type: 'match_following';
      prompt: string;
      leftItems: Array<{ id: string; text: string }>;
      rightItems: Array<{ id: string; text: string }>;
      correctPairs: Array<[string, string]>;
    })
  | (KaniQuestionBase & { type: 'assertion_reason'; assertion: string; reason: string; options: string[]; answerIndex: number })
  | (KaniQuestionBase & { type: 'sequence_order'; prompt: string; items: string[]; correctOrder: number[] })
  | (KaniQuestionBase & { type: 'long_answer'; prompt: string; modelAnswer: string })
  | (KaniQuestionBase & { type: 'diagram_label'; prompt: string; labels: string[]; answerMap: Record<string, string> })
  | (KaniQuestionBase & { type: 'interactive_external'; prompt?: string; externalRef: { activityId: string; launchUrl: string; [key: string]: unknown } });

export interface KaniCatalogSubject {
  id: string;
  title: string;
  grade?: string;
  order?: number;
}

export interface KaniCatalogTopic {
  id: string;
  subjectId: string;
  title: string;
  grade?: string;
  difficulty: KaniDifficulty;
  conceptTags: string[];
  pageRefs: string[];
  order?: number;
}

export interface KaniCatalogPage {
  id: string;
  topicId: string;
  subjectId: string;
  title: string;
  activityType: KaniActivityType;
  contentUrl: string;
  learnerUrl?: string;
  grade?: string;
  difficulty: KaniDifficulty;
  skillIds: string[];
  conceptTags: string[];
  order?: number;
}

export interface KaniCatalogV1 {
  schemaVersion: typeof KANI_SCHEMA_VERSION;
  publishedAt: string;
  sourceApp: 'study-hub';
  subjects: KaniCatalogSubject[];
  topics: KaniCatalogTopic[];
  pages: KaniCatalogPage[];
}

export interface StudyHubPageDocument {
  id: string;
  topicId: string;
  title: string;
  pageKind?: string;
  difficulty?: string;
  conceptTags?: string[];
  skillIds?: string[];
  blocks?: unknown[];
  clarifiers?: unknown[];
  questions?: unknown[];
  [key: string]: unknown;
}

export interface KaniAttemptV1 {
  schemaVersion: typeof KANI_SCHEMA_VERSION;
  attemptId: string;
  studentId: string;
  activityId: string;
  activityType: KaniActivityType;
  sourceApp: KaniSourceApp;
  subjectId?: string;
  topicId?: string;
  pageId?: string;
  questionId?: string;
  roundId?: string;
  skillIds: string[];
  difficulty: KaniDifficulty;
  correct?: boolean;
  partialCredit?: number;
  responseTimeMs?: number;
  hintsUsed?: number;
  score?: number;
  startedAt?: string;
  completedAt: string;
}

export interface KaniActivityEnvelope {
  schemaVersion: typeof KANI_SCHEMA_VERSION;
  launchId: string;
  activityId: string;
}

export type KaniActivityMessage =
  | (KaniActivityEnvelope & { type: 'kani.activity.ready' })
  | (KaniActivityEnvelope & {
      type: 'kani.activity.launch';
      payload: {
        studentId: string;
        activityType: KaniActivityType;
        subjectId?: string;
        topicId?: string;
        pageId?: string;
        skillIds: string[];
        difficulty: KaniDifficulty;
      };
    })
  | (KaniActivityEnvelope & { type: 'kani.activity.started'; payload: { studentId: string; startedAt: string } })
  | (KaniActivityEnvelope & {
      type: 'kani.activity.completed';
      payload: {
        studentId: string;
        attemptId: string;
        activityType: KaniActivityType;
        correct?: number;
        total?: number;
        accuracy?: number;
        score?: number;
        durationSeconds?: number;
        difficulty: KaniDifficulty;
        skillIds: string[];
        completedAt: string;
      };
    })
  | (KaniActivityEnvelope & { type: 'kani.activity.cancelled'; payload: { studentId?: string; cancelledAt: string } })
  | (KaniActivityEnvelope & { type: 'kani.activity.error'; payload: { code: string; message: string } });

export interface AttemptFilter {
  activityId?: string;
  activityType?: KaniActivityType;
  topicId?: string;
  skillId?: string;
  limit?: number;
}
