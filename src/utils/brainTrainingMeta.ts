import { LeaderboardEntry } from '../types';

export const BRAIN_SKILL_BY_GAME: Record<string, string> = {
    'pattern-forge': 'Pattern Recognition',
    'logic-lab': 'Deductive Logic',
    'odd-wizard': 'Classification',
    'sorting-station': 'Ordering & Sequencing',
    'code-breaker': 'Coding & Decoding',
    'memory-matrix': 'Working Memory',
    'sequence-sprint': 'Memory & Concentration',
    'path-planner': 'Planning & Spatial Reasoning',
    'data-detective': 'Data Reasoning',
    'venn-voyager': 'Set Classification',
    'mirror-match': 'Visual-Spatial Reasoning',
    'scale-sense': 'Numerical Reasoning',
    'cause-effect': 'Analytical Thinking',
    'analogy-arena': 'Verbal Reasoning',
    'sequence-story': 'Sequencing',
    'classify-quest': 'Classification',
};

export const BRAIN_TITLE_BY_GAME: Record<string, string> = {
    'pattern-forge': 'Pattern Forge',
    'logic-lab': 'Logic Lab',
    'odd-wizard': 'Odd Wizard',
    'sorting-station': 'Sorting Station',
    'code-breaker': 'Code Breaker',
    'memory-matrix': 'Memory Matrix',
    'sequence-sprint': 'Sequence Sprint',
    'path-planner': 'Path Planner',
    'data-detective': 'Data Detective',
    'venn-voyager': 'Venn Voyager',
    'mirror-match': 'Mirror Match',
    'scale-sense': 'Scale Sense',
    'cause-effect': 'Cause & Effect',
    'analogy-arena': 'Analogy Arena',
    'sequence-story': 'Sequence Story',
    'classify-quest': 'Classify Quest',
};

export const BRAIN_GAME_ID_BY_TITLE: Record<string, string> = Object.fromEntries(
    Object.entries(BRAIN_TITLE_BY_GAME).map(([gameId, title]) => [title, gameId])
);

export interface BrainGameProgress {
    plays: number;
    bestStars: number;
    bestStreak: number;
    lastPlayed?: string;
}

export const getBrainGameProgress = (
    leaderboard: LeaderboardEntry[],
    gameId: string,
    studentName?: string | null,
    studentId?: string | null
): BrainGameProgress => {
    const normalizedName = studentName?.trim().toLowerCase();
    const entries = leaderboard.filter(entry => {
        if (entry.game !== gameId) return false;
        if (studentId && entry.studentId) return entry.studentId === studentId;
        if (!normalizedName) return true;
        return entry.name.trim().toLowerCase() === normalizedName;
    });

    return {
        plays: entries.length,
        bestStars: entries.reduce((max, entry) => Math.max(max, entry.stars || 0), 0),
        bestStreak: entries.reduce((max, entry) => Math.max(max, entry.streak || 0), 0),
        lastPlayed: entries.length
            ? [...entries].sort((a, b) => b.date.localeCompare(a.date))[0].date
            : undefined,
    };
};

export const getBrainTrainingSummary = (
    leaderboard: LeaderboardEntry[],
    gameIds: string[],
    studentName?: string | null,
    studentId?: string | null
) => {
    const progress = gameIds.map(gameId => getBrainGameProgress(leaderboard, gameId, studentName, studentId));
    return {
        gamesTried: progress.filter(item => item.plays > 0).length,
        savedSessions: progress.reduce((sum, item) => sum + item.plays, 0),
        bestStreak: progress.reduce((max, item) => Math.max(max, item.bestStreak), 0),
        bestStars: progress.reduce((max, item) => Math.max(max, item.bestStars), 0),
    };
};
