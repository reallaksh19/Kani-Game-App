import { BrainReviewItem } from './brainReview';

export interface BrainQuestionReview {
    round: number;
    correct: boolean;
    prompt: string;
    selected: string;
    answer: string;
    explanation?: string;
}

export interface BrainSessionMetrics {
    difficulty: string;
    correct: number;
    attempted: number;
    durationSeconds: number;
    questionReview?: BrainQuestionReview[];
}

export interface BrainSessionDraft extends BrainSessionMetrics {
    studentName?: string;
    gameId: string;
    gameTitle: string;
    skill: string;
    stars: number;
    streak: number;
    reviewItems?: BrainReviewItem[];
}

/**
 * One saved Brain Training session.
 *
 * `performanceScore` is a short-term session metric derived from the observed
 * session. It is not durable learning mastery.
 *
 * `masteryScore` is retained only so legacy localStorage records can be read
 * and migrated without losing history. New records must not write it.
 */
export interface BrainSessionRecord extends BrainSessionDraft {
    id: string;
    studentId: string;
    studentName: string;
    completedAt: string;
    accuracy: number;
    averageSeconds: number;
    performanceScore: number;
    /** @deprecated Legacy persisted field. Read for migration only. */
    masteryScore?: number;
}

export interface BrainSkillEvidence {
    skill: string;
    sessions: number;
    recentPerformance: number;
    accuracy: number;
    trend: number;
    lastPlayed?: string;
}

export interface BrainGameEvidence {
    gameId: string;
    sessions: number;
    recentPerformance: number;
    accuracy: number;
    trend: number;
    bestStars: number;
    bestStreak: number;
    lastPlayed?: string;
    byDifficulty: Partial<Record<'Easy' | 'Medium' | 'Hard' | 'Mixed', number>>;
}

export interface BrainEvidenceSummary {
    totalSessions: number;
    recentPerformance: number;
    overallAccuracy: number;
    strongestRecentSkill?: BrainSkillEvidence;
    reviewFocusSkill?: BrainSkillEvidence;
    skills: BrainSkillEvidence[];
    recentSessions: BrainSessionRecord[];
}

/** @deprecated Use BrainSkillEvidence. The data is recent evidence, not mastery. */
export type BrainSkillMastery = BrainSkillEvidence;
/** @deprecated Use BrainGameEvidence. The data is recent evidence, not mastery. */
export type BrainGameMastery = BrainGameEvidence;
/** @deprecated Use BrainEvidenceSummary. The data is recent evidence, not mastery. */
export type BrainMasterySummary = BrainEvidenceSummary;
