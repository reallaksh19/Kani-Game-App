import { describe, expect, it } from 'vitest';
import { BrainSessionDraft } from '../types/brainProgress';
import {
    calculateBrainMastery,
    createBrainSessionRecord,
    filterBrainSessions,
    getBrainGameMastery,
    getBrainMasterySummary,
} from './brainProgress';

const draft = (overrides: Partial<BrainSessionDraft> = {}): BrainSessionDraft => ({
    gameId: 'memory-matrix',
    gameTitle: 'Memory Matrix',
    skill: 'Working Memory',
    difficulty: 'Medium',
    stars: 80,
    streak: 4,
    correct: 8,
    attempted: 10,
    durationSeconds: 60,
    ...overrides,
});

describe('Brain mastery progress', () => {
    it('weights mastery by challenge level without using raw score', () => {
        expect(calculateBrainMastery(8, 10, 'Easy')).toBe(72);
        expect(calculateBrainMastery(8, 10, 'Medium')).toBe(80);
        expect(calculateBrainMastery(8, 10, 'Hard')).toBe(88);
        expect(calculateBrainMastery(10, 10, 'Hard')).toBe(100);
    });

    it('keeps student histories isolated by id', () => {
        const a = createBrainSessionRecord(draft(), 'student-a', 'Alex', new Date('2026-09-01T10:00:00Z'));
        const b = createBrainSessionRecord(draft({ correct: 4 }), 'student-b', 'Alex', new Date('2026-09-01T11:00:00Z'));
        expect(filterBrainSessions([a, b], 'student-a', 'Alex')).toEqual([a]);
        expect(filterBrainSessions([a, b], 'student-b', 'Alex')).toEqual([b]);
    });

    it('builds game difficulty mastery and an improvement trend', () => {
        const sessions = [
            createBrainSessionRecord(draft({ difficulty: 'Hard', correct: 9 }), 's1', 'Maya', new Date('2026-09-06T10:00:00Z')),
            createBrainSessionRecord(draft({ difficulty: 'Medium', correct: 9 }), 's1', 'Maya', new Date('2026-09-05T10:00:00Z')),
            createBrainSessionRecord(draft({ difficulty: 'Medium', correct: 8 }), 's1', 'Maya', new Date('2026-09-04T10:00:00Z')),
            createBrainSessionRecord(draft({ difficulty: 'Easy', correct: 6 }), 's1', 'Maya', new Date('2026-09-03T10:00:00Z')),
            createBrainSessionRecord(draft({ difficulty: 'Easy', correct: 5 }), 's1', 'Maya', new Date('2026-09-02T10:00:00Z')),
        ];
        const progress = getBrainGameMastery(sessions, 'memory-matrix', 's1', 'Maya');
        expect(progress.sessions).toBe(5);
        expect(progress.byDifficulty.Easy).toBeDefined();
        expect(progress.byDifficulty.Medium).toBeDefined();
        expect(progress.byDifficulty.Hard).toBeDefined();
        expect(progress.trend).toBeGreaterThan(0);
    });

    it('identifies strongest and practice-focus skills', () => {
        const sessions = [
            createBrainSessionRecord(draft({ skill: 'Working Memory', correct: 9 }), 's1', 'Maya', new Date('2026-09-05T10:00:00Z')),
            createBrainSessionRecord(draft({ gameId: 'logic-lab', gameTitle: 'Logic Lab', skill: 'Deductive Logic', correct: 5 }), 's1', 'Maya', new Date('2026-09-04T10:00:00Z')),
        ];
        const summary = getBrainMasterySummary(sessions, 's1', 'Maya');
        expect(summary.strongestSkill?.skill).toBe('Working Memory');
        expect(summary.focusSkill?.skill).toBe('Deductive Logic');
        expect(summary.totalSessions).toBe(2);
    });
});
