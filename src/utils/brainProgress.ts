import {
    BrainGameMastery,
    BrainMasterySummary,
    BrainSessionDraft,
    BrainSessionRecord,
    BrainSkillMastery,
} from '../types/brainProgress';

const STORAGE_KEY = 'learning-galaxy-brain-sessions-v1';
const MAX_SESSIONS = 250;
const MAX_REVIEW_ITEMS = 6;

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const avg = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const difficultyFactor = (difficulty: string) => {
    if (difficulty === 'Easy') return 0.9;
    if (difficulty === 'Hard') return 1.1;
    return 1;
};

export const calculateBrainMastery = (correct: number, attempted: number, difficulty: string) => {
    if (attempted <= 0) return 0;
    const accuracy = clamp((correct / attempted) * 100);
    return Math.round(clamp(accuracy * difficultyFactor(difficulty)));
};

const normalizeName = (value?: string | null) => (value || '').trim().toLowerCase();

export const createBrainSessionRecord = (
    draft: BrainSessionDraft,
    studentId: string,
    studentName: string,
    now = new Date()
): BrainSessionRecord => {
    const attempted = Math.max(0, Math.round(draft.attempted));
    const correct = clamp(Math.round(draft.correct), 0, attempted || 0);
    const durationSeconds = Math.max(0, Math.round(draft.durationSeconds));
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    const completedAt = now.toISOString();

    return {
        ...draft,
        studentId,
        studentName,
        attempted,
        correct,
        durationSeconds,
        reviewItems: draft.reviewItems?.slice(0, MAX_REVIEW_ITEMS),
        questionReview: draft.questionReview?.slice(0, MAX_REVIEW_ITEMS),
        id: `${studentId}:${draft.gameId}:${now.getTime()}:${Math.random().toString(36).slice(2, 8)}`,
        completedAt,
        accuracy,
        averageSeconds: attempted > 0 ? Math.round(durationSeconds / attempted) : 0,
        masteryScore: calculateBrainMastery(correct, attempted, draft.difficulty),
    };
};

export const loadBrainSessions = async (): Promise<BrainSessionRecord[]> => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((session): session is BrainSessionRecord => Boolean(
            session &&
            typeof session.id === 'string' &&
            typeof session.studentId === 'string' &&
            typeof session.gameId === 'string' &&
            typeof session.completedAt === 'string'
        )).slice(0, MAX_SESSIONS);
    } catch {
        return [];
    }
};

export const saveBrainSessions = async (sessions: BrainSessionRecord[]) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
    } catch {
        // Progress tracking must never block game play when storage is unavailable.
    }
};

export const filterBrainSessions = (
    sessions: BrainSessionRecord[],
    studentId?: string | null,
    studentName?: string | null
) => {
    const normalizedName = normalizeName(studentName);
    return sessions
        .filter(session => {
            if (studentId) return session.studentId === studentId;
            if (normalizedName) return normalizeName(session.studentName) === normalizedName;
            return false;
        })
        .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
};

const weightedRecent = (sessions: BrainSessionRecord[], selector: (session: BrainSessionRecord) => number) => {
    const recent = sessions.slice(0, 5);
    if (!recent.length) return 0;
    let weighted = 0;
    let totalWeight = 0;
    recent.forEach((session, index) => {
        const weight = recent.length - index;
        weighted += selector(session) * weight;
        totalWeight += weight;
    });
    return weighted / totalWeight;
};

const getTrend = (sessions: BrainSessionRecord[]) => {
    if (sessions.length < 4) return 0;
    const latest = sessions.slice(0, 3).map(session => session.masteryScore);
    const previous = sessions.slice(3, 6).map(session => session.masteryScore);
    if (!previous.length) return 0;
    return Math.round(avg(latest) - avg(previous));
};

export const getBrainGameMastery = (
    sessions: BrainSessionRecord[],
    gameId: string,
    studentId?: string | null,
    studentName?: string | null
): BrainGameMastery => {
    const gameSessions = filterBrainSessions(sessions, studentId, studentName)
        .filter(session => session.gameId === gameId);
    const byDifficulty: BrainGameMastery['byDifficulty'] = {};
    (['Easy', 'Medium', 'Hard', 'Mixed'] as const).forEach(level => {
        const values = gameSessions.filter(session => session.difficulty === level).map(session => session.masteryScore);
        if (values.length) byDifficulty[level] = Math.round(avg(values.slice(0, 5)));
    });

    return {
        gameId,
        sessions: gameSessions.length,
        mastery: Math.round(weightedRecent(gameSessions, session => session.masteryScore)),
        accuracy: Math.round(weightedRecent(gameSessions, session => session.accuracy)),
        trend: getTrend(gameSessions),
        bestStars: gameSessions.reduce((max, session) => Math.max(max, session.stars || 0), 0),
        bestStreak: gameSessions.reduce((max, session) => Math.max(max, session.streak || 0), 0),
        lastPlayed: gameSessions[0]?.completedAt,
        byDifficulty,
    };
};

export const getBrainMasterySummary = (
    sessions: BrainSessionRecord[],
    studentId?: string | null,
    studentName?: string | null
): BrainMasterySummary => {
    const studentSessions = filterBrainSessions(sessions, studentId, studentName);
    const grouped = new Map<string, BrainSessionRecord[]>();
    studentSessions.forEach(session => {
        const current = grouped.get(session.skill) || [];
        current.push(session);
        grouped.set(session.skill, current);
    });

    const skills: BrainSkillMastery[] = [...grouped.entries()].map(([skill, skillSessions]) => ({
        skill,
        sessions: skillSessions.length,
        mastery: Math.round(weightedRecent(skillSessions, session => session.masteryScore)),
        accuracy: Math.round(weightedRecent(skillSessions, session => session.accuracy)),
        trend: getTrend(skillSessions),
        lastPlayed: skillSessions[0]?.completedAt,
    })).sort((a, b) => b.mastery - a.mastery || b.sessions - a.sessions);

    return {
        totalSessions: studentSessions.length,
        overallMastery: Math.round(weightedRecent(studentSessions, session => session.masteryScore)),
        overallAccuracy: Math.round(weightedRecent(studentSessions, session => session.accuracy)),
        strongestSkill: skills[0],
        focusSkill: skills.length ? [...skills].sort((a, b) => a.mastery - b.mastery || b.sessions - a.sessions)[0] : undefined,
        skills,
        recentSessions: studentSessions.slice(0, 5),
    };
};
