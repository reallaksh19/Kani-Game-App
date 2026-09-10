import {
    BrainEvidenceSummary,
    BrainGameEvidence,
    BrainSessionDraft,
    BrainSessionRecord,
    BrainSkillEvidence,
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

/**
 * A transparent, short-term session performance signal.
 *
 * This is deliberately NOT durable mastery. Retention, transfer,
 * independence and support dependency require separate evidence.
 */
export const calculateBrainPerformance = (correct: number, attempted: number, difficulty: string) => {
    if (attempted <= 0) return 0;
    const accuracy = clamp((correct / attempted) * 100);
    return Math.round(clamp(accuracy * difficultyFactor(difficulty)));
};

/** @deprecated Use calculateBrainPerformance. This value is not durable mastery. */
export const calculateBrainMastery = calculateBrainPerformance;

const normalizeName = (value?: string | null) => (value || '').trim().toLowerCase();

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

/**
 * Normalizes legacy localStorage records that persisted `masteryScore`.
 * New in-memory records always expose `performanceScore` and do not retain
 * the legacy mastery field.
 */
export const normalizeBrainSessionRecord = (value: unknown): BrainSessionRecord | null => {
    if (!value || typeof value !== 'object') return null;
    const session = value as Record<string, unknown>;
    if (
        typeof session.id !== 'string' ||
        typeof session.studentId !== 'string' ||
        typeof session.gameId !== 'string' ||
        typeof session.completedAt !== 'string'
    ) return null;

    const attempted = isFiniteNumber(session.attempted) ? Math.max(0, Math.round(session.attempted)) : 0;
    const correct = isFiniteNumber(session.correct) ? clamp(Math.round(session.correct), 0, attempted || 0) : 0;
    const difficulty = typeof session.difficulty === 'string' ? session.difficulty : 'Mixed';
    const performanceScore = isFiniteNumber(session.performanceScore)
        ? Math.round(clamp(session.performanceScore))
        : isFiniteNumber(session.masteryScore)
            ? Math.round(clamp(session.masteryScore))
            : calculateBrainPerformance(correct, attempted, difficulty);

    const { masteryScore: _legacyMasteryScore, ...rest } = session;
    return {
        ...(rest as unknown as BrainSessionRecord),
        attempted,
        correct,
        performanceScore,
    };
};

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
        performanceScore: calculateBrainPerformance(correct, attempted, draft.difficulty),
    };
};

export const loadBrainSessions = async (): Promise<BrainSessionRecord[]> => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map(normalizeBrainSessionRecord)
            .filter((session): session is BrainSessionRecord => Boolean(session))
            .slice(0, MAX_SESSIONS);
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
    const latest = sessions.slice(0, 3).map(session => session.performanceScore);
    const previous = sessions.slice(3, 6).map(session => session.performanceScore);
    if (!previous.length) return 0;
    return Math.round(avg(latest) - avg(previous));
};

export const getBrainGameEvidence = (
    sessions: BrainSessionRecord[],
    gameId: string,
    studentId?: string | null,
    studentName?: string | null
): BrainGameEvidence => {
    const gameSessions = filterBrainSessions(sessions, studentId, studentName)
        .filter(session => session.gameId === gameId);
    const byDifficulty: BrainGameEvidence['byDifficulty'] = {};
    (['Easy', 'Medium', 'Hard', 'Mixed'] as const).forEach(level => {
        const values = gameSessions
            .filter(session => session.difficulty === level)
            .map(session => session.performanceScore);
        if (values.length) byDifficulty[level] = Math.round(avg(values.slice(0, 5)));
    });

    return {
        gameId,
        sessions: gameSessions.length,
        recentPerformance: Math.round(weightedRecent(gameSessions, session => session.performanceScore)),
        accuracy: Math.round(weightedRecent(gameSessions, session => session.accuracy)),
        trend: getTrend(gameSessions),
        bestStars: gameSessions.reduce((max, session) => Math.max(max, session.stars || 0), 0),
        bestStreak: gameSessions.reduce((max, session) => Math.max(max, session.streak || 0), 0),
        lastPlayed: gameSessions[0]?.completedAt,
        byDifficulty,
    };
};

export const getBrainEvidenceSummary = (
    sessions: BrainSessionRecord[],
    studentId?: string | null,
    studentName?: string | null
): BrainEvidenceSummary => {
    const studentSessions = filterBrainSessions(sessions, studentId, studentName);
    const grouped = new Map<string, BrainSessionRecord[]>();
    studentSessions.forEach(session => {
        const current = grouped.get(session.skill) || [];
        current.push(session);
        grouped.set(session.skill, current);
    });

    const skills: BrainSkillEvidence[] = [...grouped.entries()].map(([skill, skillSessions]) => ({
        skill,
        sessions: skillSessions.length,
        recentPerformance: Math.round(weightedRecent(skillSessions, session => session.performanceScore)),
        accuracy: Math.round(weightedRecent(skillSessions, session => session.accuracy)),
        trend: getTrend(skillSessions),
        lastPlayed: skillSessions[0]?.completedAt,
    })).sort((a, b) => b.recentPerformance - a.recentPerformance || b.sessions - a.sessions);

    return {
        totalSessions: studentSessions.length,
        recentPerformance: Math.round(weightedRecent(studentSessions, session => session.performanceScore)),
        overallAccuracy: Math.round(weightedRecent(studentSessions, session => session.accuracy)),
        strongestRecentSkill: skills[0],
        reviewFocusSkill: skills.length
            ? [...skills].sort((a, b) => a.recentPerformance - b.recentPerformance || b.sessions - a.sessions)[0]
            : undefined,
        skills,
        recentSessions: studentSessions.slice(0, 5),
    };
};

/** @deprecated Use getBrainGameEvidence. The returned values are recent evidence, not mastery. */
export const getBrainGameMastery = getBrainGameEvidence;
/** @deprecated Use getBrainEvidenceSummary. The returned values are recent evidence, not mastery. */
export const getBrainMasterySummary = getBrainEvidenceSummary;
