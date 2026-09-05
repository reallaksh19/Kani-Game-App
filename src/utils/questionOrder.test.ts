import { describe, expect, it } from 'vitest';
import { orderItems, pickOrderedItem } from './questionOrder';

const seeded = (values: number[]) => {
    let index = 0;
    return () => values[index++ % values.length];
};

describe('questionOrder', () => {
    it('preserves authored order when randomisation is off', () => {
        const source = ['Q1', 'Q2', 'Q3', 'Q4'];
        const result = orderItems(source, false);
        expect(result).toEqual(source);
        expect(result).not.toBe(source);
    });

    it('shuffles a copy when randomisation is on', () => {
        const source = ['Q1', 'Q2', 'Q3', 'Q4'];
        const result = orderItems(source, true, seeded([0.1, 0.7, 0.2]));
        expect(result).not.toEqual(source);
        expect([...result].sort()).toEqual([...source].sort());
        expect(source).toEqual(['Q1', 'Q2', 'Q3', 'Q4']);
    });

    it('uses the first authored group when randomisation is off', () => {
        expect(pickOrderedItem(['Story A', 'Story B'], false)).toBe('Story A');
    });
});
