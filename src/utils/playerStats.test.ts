import { describe, it, expect } from 'vitest';
import {
    normalizeSkillName,
    calculateSkillLevel,
    evaluateBadgeUnlocks,
    recordLotSession,
    DEFAULT_PLAYER_STATS,
    PlayerStats
} from './playerStats';
import { Question } from '../types';

describe('playerStats utilities', () => {
    describe('normalizeSkillName', () => {
        it('normalizes verbal keywords correctly', () => {
            expect(normalizeSkillName('Verbal')).toBe('Verbal');
            expect(normalizeSkillName('Word Riddle')).toBe('Verbal');
            expect(normalizeSkillName('Vowel Count')).toBe('Verbal');
            expect(normalizeSkillName('Idiom Meaning')).toBe('Verbal');
            expect(normalizeSkillName('Homophones')).toBe('Verbal');
        });

        it('normalizes numerical keywords correctly', () => {
            expect(normalizeSkillName('Numerical Ability')).toBe('Numerical Ability');
            expect(normalizeSkillName('Number Riddle')).toBe('Numerical Ability');
            expect(normalizeSkillName('Math Arithmetic')).toBe('Numerical Ability');
            expect(normalizeSkillName('Digit Calculations')).toBe('Numerical Ability');
        });

        it('normalizes memory keywords correctly', () => {
            expect(normalizeSkillName('Memory and Concentration')).toBe('Memory and Concentration');
            expect(normalizeSkillName('Direction Sense')).toBe('Memory and Concentration');
            expect(normalizeSkillName('Calendar Dates')).toBe('Memory and Concentration');
        });

        it('normalizes visual keywords correctly', () => {
            expect(normalizeSkillName('Visual Reasoning')).toBe('Visual Reasoning');
            expect(normalizeSkillName('Hidden Figures')).toBe('Visual Reasoning');
            expect(normalizeSkillName('Shape Patterns')).toBe('Visual Reasoning');
            expect(normalizeSkillName('Mirror Symmetry')).toBe('Visual Reasoning');
        });

        it('defaults unknown skills to Analytical Thinking', () => {
            expect(normalizeSkillName('Blood Relations')).toBe('Analytical Thinking');
            expect(normalizeSkillName('Pattern Matrix')).toBe('Analytical Thinking');
            expect(normalizeSkillName('')).toBe('Analytical Thinking');
            expect(normalizeSkillName(undefined)).toBe('Analytical Thinking');
        });
    });

    describe('calculateSkillLevel', () => {
        it('calculates beginner tier for low correct counts', () => {
            const lv0 = calculateSkillLevel(0);
            expect(lv0.level).toBe(1);
            expect(lv0.levelTitle).toBe('Beginner');
            expect(lv0.progressPercent).toBe(0);

            const lv3 = calculateSkillLevel(3);
            expect(lv3.level).toBe(1);
            expect(lv3.levelTitle).toBe('Beginner');
            expect(lv3.progressPercent).toBeGreaterThan(0);
        });

        it('calculates intermediate tiers (LV2 - LV4)', () => {
            const lv2 = calculateSkillLevel(5);
            expect(lv2.level).toBe(2);
            expect(lv2.levelTitle).toBe('Learner');
            expect(lv2.progressPercent).toBe(25);

            const lv3 = calculateSkillLevel(10);
            expect(lv3.level).toBe(3);
            expect(lv3.levelTitle).toBe('Skilled');
            expect(lv3.progressPercent).toBe(50);

            const lv4 = calculateSkillLevel(15);
            expect(lv4.level).toBe(4);
            expect(lv4.levelTitle).toBe('Advanced');
            expect(lv4.progressPercent).toBe(75);
        });

        it('caps at Level 5 Master for 20+ correct', () => {
            const lv5 = calculateSkillLevel(20);
            expect(lv5.level).toBe(5);
            expect(lv5.levelTitle).toBe('Master');
            expect(lv5.progressPercent).toBe(100);

            const lv5Over = calculateSkillLevel(35);
            expect(lv5Over.level).toBe(5);
            expect(lv5Over.levelTitle).toBe('Master');
            expect(lv5Over.progressPercent).toBe(100);
        });
    });

    describe('evaluateBadgeUnlocks', () => {
        it('awards rookie-pilot upon first lot completion', () => {
            const stats: PlayerStats = {
                ...DEFAULT_PLAYER_STATS,
                totalLotsCompleted: 1
            };
            const badges = evaluateBadgeUnlocks(stats, 'lq-lot-1', 12, 20, 400, 3);
            expect(badges.some(b => b.id === 'rookie-pilot')).toBe(true);
        });

        it('awards streak-master on streak >= 5', () => {
            const stats: PlayerStats = {
                ...DEFAULT_PLAYER_STATS,
                bestStreak: 2
            };
            const badges = evaluateBadgeUnlocks(stats, 'lq-lot-1', 14, 20, 400, 5);
            expect(badges.some(b => b.id === 'streak-master')).toBe(true);
        });

        it('awards lightning-logic if 20 questions completed in under 6 minutes (360s)', () => {
            const stats: PlayerStats = {
                ...DEFAULT_PLAYER_STATS
            };
            const badges = evaluateBadgeUnlocks(stats, 'lq-lot-1', 18, 20, 240, 4);
            expect(badges.some(b => b.id === 'lightning-logic')).toBe(true);
        });

        it('awards flawless-champ on 100% score (20/20)', () => {
            const stats: PlayerStats = {
                ...DEFAULT_PLAYER_STATS
            };
            const badges = evaluateBadgeUnlocks(stats, 'lq-lot-1', 20, 20, 400, 20);
            expect(badges.some(b => b.id === 'flawless-champ')).toBe(true);
        });

        it('does not re-award already unlocked badges', () => {
            const stats: PlayerStats = {
                ...DEFAULT_PLAYER_STATS,
                totalLotsCompleted: 2,
                unlockedBadgeIds: ['rookie-pilot', 'streak-master']
            };
            const badges = evaluateBadgeUnlocks(stats, 'lq-lot-2', 15, 20, 500, 6);
            expect(badges.some(b => b.id === 'rookie-pilot')).toBe(false);
            expect(badges.some(b => b.id === 'streak-master')).toBe(false);
        });
    });

    describe('recordLotSession', () => {
        it('records answers, advances skill counts, and unlocks badges', () => {
            const mockQuestions: Question[] = [
                {
                    game_type: 'lq-lot-1',
                    difficulty: 'Medium',
                    text1: 'Solve 2 + 2',
                    text2: 'Numerical Ability',
                    answer: '4',
                    option1: '4',
                    option2: '5',
                    option3: '3',
                    option4: '6'
                },
                {
                    game_type: 'lq-lot-1',
                    difficulty: 'Medium',
                    text1: 'Find synonym for big',
                    text2: 'Verbal',
                    answer: 'Huge',
                    option1: 'Huge',
                    option2: 'Tiny',
                    option3: 'Small',
                    option4: 'Soft'
                }
            ];

            const answers = {
                0: { selected: '4', isCorrect: true },
                1: { selected: 'Huge', isCorrect: true }
            };

            const { updatedStats, newBadges } = recordLotSession(
                DEFAULT_PLAYER_STATS,
                'lq-lot-1',
                mockQuestions,
                answers,
                120, // 2 mins
                40, // stars
                2 // streak
            );

            expect(updatedStats.totalQuestionsSolved).toBe(2);
            expect(updatedStats.totalStars).toBe(40);
            expect(updatedStats.bestStreak).toBe(2);
            expect(updatedStats.totalLotsCompleted).toBe(1);
            expect(updatedStats.skillStats['Numerical Ability'].correct).toBe(1);
            expect(updatedStats.skillStats['Verbal'].correct).toBe(1);
            expect(updatedStats.lotProgress['lq-lot-1'].completed).toBe(true);
            expect(newBadges.some(b => b.id === 'rookie-pilot')).toBe(true);
        });
    });
});
