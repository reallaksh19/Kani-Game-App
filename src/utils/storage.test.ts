import { storage } from './storage';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('storage', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it('sets and gets data', async () => {
        await storage.set('test-key', 'test-value');
        const value = await storage.get('test-key');
        expect(value).toEqual({ value: 'test-value' });
    });

    it('returns null for missing keys', async () => {
        const value = await storage.get('non-existent');
        expect(value).toBeNull();
    });

    it('removes data', async () => {
        await storage.set('remove-me', 'data');
        await storage.remove('remove-me');
        const value = await storage.get('remove-me');
        expect(value).toBeNull();
    });
});
