import { storage } from './storage';
import { Question } from '../types';
import badgesData from '../../public/data/badges.json';

export interface Badge {
    id: string;
    title: string;
    icon: string;
    description: string;
    category: string;
}

export interface SkillProgress {
    skill: string;
    icon: string;
    attempted: number;
    correct: number;
    level: number;
    levelTitle: string;
    progressPercent: number;
}

export interface PlayerStats {
    totalLotsCompleted: number;
    totalQuestionsSolved: number;
    totalStars: number;
    bestStreak: number;
    totalTimeSpentSeconds: number;
    skillStats: Record<string, { attempted: number; correct: number }>;
    lotProgress: Record<string, {
        completed: boolean;
        bestScore: number;
        stars: number;
        attempts: number;
        lastPlayed: string;
    }>;
    unlockedBadgeIds: string[];
}

export const ALL_BADGES: Badge[] = badgesData as Badge[];

export const DEFAULT_PLAYER_STATS: PlayerStats = {
    totalLotsCompleted: 0,
    totalQuestionsSolved: 0,
    totalStars: 0,
    bestStreak: 0,
    totalTimeSpentSeconds: 0,
    skillStats: {
        'Numerical Ability': { attempted: 0, correct: 0 },
        'Verbal': { attempted: 0, correct: 0 },
        'Memory and Concentration': { attempted: 0, correct: 0 },
        'Analytical Thinking': { attempted: 0, correct: 0 },
        'Visual Reasoning': { attempted: 0, correct: 0 }
    },
    lotProgress: {},
    unlockedBadgeIds: []
};

const STATS_STORAGE_KEY = 'learning-galaxy-player-stats';

// Normalize skill names from questions
export const normalizeSkillName = (text2?: string): string => {
    if (!text2) return 'Analytical Thinking';
    const lower = text2.toLowerCase();
    if (lower.includes('verbal') || lower.includes('idiom') || lower.includes('homophone') || lower.includes('word') || lower.includes('vowel') || lower.includes('vocab') || lower.includes('synonym') || lower.includes('antonym') || lower.includes('grammar') || lower.includes('sentence')) {
        return 'Verbal';
    }
    if (lower.includes('numeric') || lower.includes('number') || lower.includes('arithmetic') || lower.includes('math') || lower.includes('calculation') || lower.includes('digit') || lower.includes('fraction')) {
        return 'Numerical Ability';
    }
    if (lower.includes('memory') || lower.includes('direction') || lower.includes('calendar') || lower.includes('recall') || lower.includes('concentration') || lower.includes('retention')) {
        return 'Memory and Concentration';
    }
    if (lower.includes('visual') || lower.includes('hidden') || lower.includes('shape') || lower.includes('spatial') || lower.includes('rotation') || lower.includes('cube') || lower.includes('mirror') || lower.includes('symmetry')) {
        return 'Visual Reasoning';
    }
    return 'Analytical Thinking';
};

// Calculate Level 1-5 and Progress Percent
export const calculateSkillLevel = (correctCount: number) => {
    if (correctCount >= 20) return { level: 5, levelTitle: 'Master', progressPercent: 100 };
    if (correctCount >= 15) return { level: 4, levelTitle: 'Advanced', progressPercent: 75 + ((correctCount - 15) / 5) * 25 };
    if (correctCount >= 10) return { level: 3, levelTitle: 'Skilled', progressPercent: 50 + ((correctCount - 10) / 5) * 25 };
    if (correctCount >= 5) return { level: 2, levelTitle: 'Learner', progressPercent: 25 + ((correctCount - 5) / 5) * 25 };
    if (correctCount >= 1) return { level: 1, levelTitle: 'Beginner', progressPercent: Math.max(10, (correctCount / 5) * 25) };
    return { level: 1, levelTitle: 'Beginner', progressPercent: 0 };
};

// Load stats from storage
export const loadPlayerStats = async (): Promise<PlayerStats> => {
    try {
        const raw = await storage.get(STATS_STORAGE_KEY);
        if (!raw) return DEFAULT_PLAYER_STATS;
        const value = typeof raw === 'string' ? raw : (raw as any).value;
        if (!value) return DEFAULT_PLAYER_STATS;
        const parsed = JSON.parse(value);
        return {
            ...DEFAULT_PLAYER_STATS,
            ...parsed,
            skillStats: {
                ...DEFAULT_PLAYER_STATS.skillStats,
                ...(parsed.skillStats || {})
            }
        };
    } catch (e) {
        console.error('Failed to load player stats', e);
        return DEFAULT_PLAYER_STATS;
    }
};

// Save stats to storage
export const savePlayerStats = async (stats: PlayerStats): Promise<void> => {
    try {
        await storage.set(STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch (e) {
        console.error('Failed to save player stats', e);
    }
};

// Evaluate badge unlocks
export const evaluateBadgeUnlocks = (
    currentStats: PlayerStats,
    _newLotId: string,
    lotScore: number,
    totalLotQuestions: number,
    sessionDurationSeconds: number,
    sessionStreak: number
): Badge[] => {
    const newlyUnlocked: Badge[] = [];
    const unlockedSet = new Set(currentStats.unlockedBadgeIds || []);

    const checkAndAward = (badgeId: string) => {
        if (!unlockedSet.has(badgeId)) {
            const badge = ALL_BADGES.find(b => b.id === badgeId);
            if (badge) {
                newlyUnlocked.push(badge);
                unlockedSet.add(badgeId);
            }
        }
    };

    // 1. Rookie Pilot (First completed lot)
    if (currentStats.totalLotsCompleted >= 1) {
        checkAndAward('rookie-pilot');
    }

    // 2. Streak Master (5+ streak)
    if (sessionStreak >= 5 || currentStats.bestStreak >= 5) {
        checkAndAward('streak-master');
    }

    // 3. Lightning Logic (< 6 mins for 20 questions)
    if (totalLotQuestions >= 20 && sessionDurationSeconds > 0 && sessionDurationSeconds < 360) {
        checkAndAward('lightning-logic');
    }

    // 4. Flawless Champ (100% correct)
    if (totalLotQuestions >= 10 && lotScore === totalLotQuestions) {
        checkAndAward('flawless-champ');
    }

    // 5. Skill badges
    const numCorrect = currentStats.skillStats['Numerical Ability']?.correct || 0;
    if (numCorrect >= 10) checkAndAward('number-wizard');

    const verbalCorrect = currentStats.skillStats['Verbal']?.correct || 0;
    if (verbalCorrect >= 10) checkAndAward('word-champion');

    const logicCorrect = currentStats.skillStats['Analytical Thinking']?.correct || 0;
    if (logicCorrect >= 10) checkAndAward('logic-detective');

    // 6. Grand Olympian (Completed all 5 lots)
    const distinctLots = Object.keys(currentStats.lotProgress).filter(k => currentStats.lotProgress[k].completed);
    if (distinctLots.length >= 5) {
        checkAndAward('grand-olympian');
    }

    return newlyUnlocked;
};

// Record completed lot session
export const recordLotSession = (
    prevStats: PlayerStats,
    lotId: string,
    questions: Question[],
    answers: Record<number, { selected: string; isCorrect: boolean }>,
    durationSeconds: number,
    starsEarned: number,
    maxStreak: number
): { updatedStats: PlayerStats; newBadges: Badge[] } => {
    const updatedStats: PlayerStats = {
        ...prevStats,
        skillStats: { ...prevStats.skillStats },
        lotProgress: { ...prevStats.lotProgress },
        unlockedBadgeIds: [...prevStats.unlockedBadgeIds]
    };

    let sessionCorrect = 0;
    questions.forEach((q, idx) => {
        const ans = answers[idx];
        if (!ans) return;
        const skillName = normalizeSkillName(q.text2);
        if (!updatedStats.skillStats[skillName]) {
            updatedStats.skillStats[skillName] = { attempted: 0, correct: 0 };
        }
        updatedStats.skillStats[skillName].attempted += 1;
        if (ans.isCorrect) {
            sessionCorrect += 1;
            updatedStats.skillStats[skillName].correct += 1;
        }
    });

    updatedStats.totalQuestionsSolved += sessionCorrect;
    updatedStats.totalStars += starsEarned;
    updatedStats.bestStreak = Math.max(updatedStats.bestStreak, maxStreak);
    updatedStats.totalTimeSpentSeconds += durationSeconds;

    const existingLot = updatedStats.lotProgress[lotId] || {
        completed: false,
        bestScore: 0,
        stars: 0,
        attempts: 0,
        lastPlayed: new Date().toISOString()
    };

    const isFirstCompletion = !existingLot.completed;
    if (isFirstCompletion) {
        updatedStats.totalLotsCompleted += 1;
    }

    updatedStats.lotProgress[lotId] = {
        completed: true,
        bestScore: Math.max(existingLot.bestScore, sessionCorrect),
        stars: Math.max(existingLot.stars, starsEarned),
        attempts: existingLot.attempts + 1,
        lastPlayed: new Date().toISOString()
    };

    const newBadges = evaluateBadgeUnlocks(
        updatedStats,
        lotId,
        sessionCorrect,
        questions.length,
        durationSeconds,
        maxStreak
    );

    newBadges.forEach(b => {
        if (!updatedStats.unlockedBadgeIds.includes(b.id)) {
            updatedStats.unlockedBadgeIds.push(b.id);
        }
    });

    return { updatedStats, newBadges };
};
