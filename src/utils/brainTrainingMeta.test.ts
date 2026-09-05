import { describe, expect, it } from 'vitest';
import { getBrainGameProgress, getBrainTrainingSummary } from './brainTrainingMeta';
import { LeaderboardEntry } from '../types';

const entries: LeaderboardEntry[] = [
    { game: 'memory-matrix', name: 'Kani', stars: 70, streak: 3, date: '2026-09-01T10:00:00Z' },
    { game: 'memory-matrix', name: 'Kani', stars: 90, streak: 5, date: '2026-09-02T10:00:00Z' },
    { game: 'logic-lab', name: 'Kani', stars: 55, streak: 2, date: '2026-09-03T10:00:00Z' },
    { game: 'memory-matrix', name: 'Other', stars: 999, streak: 99, date: '2026-09-04T10:00:00Z' },
];

describe('brainTrainingMeta', () => {
    it('keeps progress student-specific', () => {
        expect(getBrainGameProgress(entries, 'memory-matrix', 'Kani')).toEqual({
            plays: 2,
            bestStars: 90,
            bestStreak: 5,
            lastPlayed: '2026-09-02T10:00:00Z',
        });
    });

    it('summarizes saved Brain Training sessions', () => {
        expect(getBrainTrainingSummary(entries, ['memory-matrix', 'logic-lab'], 'Kani')).toEqual({
            gamesTried: 2,
            savedSessions: 3,
            bestStreak: 5,
            bestStars: 90,
        });
    });
});
