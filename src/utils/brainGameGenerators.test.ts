import { describe, expect, it } from 'vitest';
import {
    chooseVennPair,
    classifyVennItem,
    coordKey,
    generateDataRound,
    generateMirrorRound,
    generatePathLevel,
    generateScaleRound,
    pickVennItem,
    reflectPattern,
    shortestPathLength,
    vennTargetCount,
} from './brainGameGenerators';
import { Difficulty } from '../types';

const seeded = (seed: number) => {
    let state = seed >>> 0;
    return () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 0x100000000;
    };
};

const difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard'];

describe('brain game generators', () => {
    it('Scale Sense never exposes an inconsistent answer and difficulty increases operand count', () => {
        const counts: number[] = [];
        difficulties.forEach((difficulty, d) => {
            const rng = seeded(100 + d);
            const round = generateScaleRound(difficulty, rng);
            counts.push(round.leftItems.length);
            expect(round.answer).toBe(round.leftItems.reduce((sum, n) => sum + n, 0));
            expect(new Set(round.options).size).toBe(4);
            expect(round.options.filter(v => v === round.answer)).toHaveLength(1);
        });
        expect(counts).toEqual([2, 3, 4]);
    });

    it('Path Planner only generates solvable boards with a sufficient move budget', () => {
        difficulties.forEach((difficulty, d) => {
            const rng = seeded(200 + d);
            for (let i = 0; i < 60; i += 1) {
                const level = generatePathLevel(difficulty, rng);
                const obstacles = new Set(level.obstacles);
                const shortest = shortestPathLength(level.size, level.start, level.goal, obstacles);
                expect(Number.isFinite(shortest)).toBe(true);
                expect(shortest).toBe(level.shortestPathLength);
                expect(level.maxMoves).toBeGreaterThanOrEqual(shortest);
                expect(obstacles.has(coordKey(level.start))).toBe(false);
                expect(obstacles.has(coordKey(level.goal))).toBe(false);
            }
        });
    });

    it('Data Detective rounds have unique extrema and exactly one valid answer choice', () => {
        difficulties.forEach((difficulty, d) => {
            const rng = seeded(300 + d);
            for (let i = 0; i < 80; i += 1) {
                const round = generateDataRound(difficulty, rng);
                const values = round.points.map(p => p.value);
                expect(new Set(values).size).toBe(values.length);
                expect(new Set(round.options).size).toBe(round.options.length);
                expect(round.options.filter(option => option === round.answer)).toHaveLength(1);
                expect(round.options.length === 2 || round.options.length === 4 || round.options.length === round.points.length).toBe(true);
            }
        });
    });

    it('Mirror Match rejects trivial symmetry and produces four unique options with one exact reflection', () => {
        difficulties.forEach((difficulty, d) => {
            const rng = seeded(400 + d);
            for (let i = 0; i < 60; i += 1) {
                const round = generateMirrorRound(difficulty, rng);
                const reflected = reflectPattern(round.pattern, round.size, round.axis);
                expect(round.pattern.join('')).not.toBe(reflected.join(''));
                expect(round.options).toHaveLength(4);
                expect(new Set(round.options.map(option => option.join(''))).size).toBe(4);
                expect(round.options[round.correctIndex]).toEqual(reflected);
                expect(round.options.filter(option => option.join('') === reflected.join(''))).toHaveLength(1);
            }
        });
    });

    it('Venn Voyager classification and mastery targets are internally consistent', () => {
        const targets = difficulties.map((difficulty, d) => {
            const rng = seeded(500 + d);
            const { difficulty: active, pair } = chooseVennPair(difficulty, rng);
            for (let i = 0; i < 30; i += 1) {
                const item = pickVennItem(pair, rng);
                expect(['A', 'B', 'Both', 'None']).toContain(classifyVennItem(item, pair));
            }
            return vennTargetCount(active);
        });
        expect(targets).toEqual([5, 7, 9]);
    });
});
