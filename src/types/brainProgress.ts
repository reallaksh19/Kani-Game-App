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

export interface BrainSessionRecord extends BrainSessionDraft {
    id: string;
    studentId: string;
    studentName: string;
    completedAt: string;
    accuracy: number;
    averageSeconds: number;
    masteryScore: number;
}

export interface BrainSkillMastery {
    skill: string;
    sessions: number;
    mastery: number;
    accuracy: number;
    trend: number;
    lastPlayed?: string;
}

export interface BrainGameMastery {
    gameId: string;
    sessions: number;
    mastery: number;
    accuracy: number;
    trend: number;
    bestStars: number;
    bestStreak: number;
    lastPlayed?: string;
    byDifficulty: Partial<Record<'Easy' | 'Medium' | 'Hard' | 'Mixed', number>>;
}

export interface BrainMasterySummary {
    totalSessions: number;
    overallMastery: number;
    overallAccuracy: number;
    strongestSkill?: BrainSkillMastery;
    focusSkill?: BrainSkillMastery;
    skills: BrainSkillMastery[];
    recentSessions: BrainSessionRecord[];
}
