import { describe, expect, it } from 'vitest';
import { findOptimalPath } from './pathReview';

describe('findOptimalPath', () => {
    it('returns a shortest valid route around obstacles', () => {
        const path = findOptimalPath({
            size: 4,
            start: { x: 0, y: 3 },
            goal: { x: 3, y: 0 },
            obstacles: ['1,3', '1,2', '2,1'],
        });

        expect(path[0]).toBe('0,3');
        expect(path.at(-1)).toBe('3,0');
        expect(path).not.toContain('1,3');
        expect(path).not.toContain('1,2');
        expect(path).not.toContain('2,1');
        expect(path.length - 1).toBe(6);
    });

    it('returns an empty path when no route exists', () => {
        const path = findOptimalPath({
            size: 3,
            start: { x: 0, y: 2 },
            goal: { x: 2, y: 0 },
            obstacles: ['0,1', '1,2'],
        });
        expect(path).toEqual([]);
    });
});
