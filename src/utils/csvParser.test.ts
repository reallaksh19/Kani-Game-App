import { parseCSV } from './csvParser';
import { describe, it, expect } from 'vitest';

describe('csvParser', () => {
    it('parses simple CSV', () => {
        const csv = 'name,age\nJohn,30\nJane,25';
        const result = parseCSV(csv);
        expect(result).toEqual([
            { name: 'John', age: '30' },
            { name: 'Jane', age: '25' }
        ]);
    });

    it('handles quoted fields with commas', () => {
        const csv = 'question,answer\n"What is 2+2?","4"\n"What is 3,000+1?","3,001"';
        const result = parseCSV(csv);
        // TypeScript might infer result items as Question type which has optional props
        // We cast or just check specific fields
        expect((result[0] as any).question).toBe('What is 2+2?');
        expect((result[1] as any).answer).toBe('3,001');
    });

    it('handles empty lines', () => {
        const csv = 'name\nJohn\n\nJane';
        const result = parseCSV(csv);
        expect(result).toHaveLength(2);
    });
});
