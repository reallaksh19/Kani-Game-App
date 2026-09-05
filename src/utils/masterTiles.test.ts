import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    MASTER_TILES,
    DEFAULT_MASTER_TILES,
    loadMasterTilesConfig,
    saveMasterTilesConfig
} from './masterTiles';
import { storage } from './storage';

describe('masterTiles utilities', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    it('contains all 5 master tiles configuration', () => {
        const ids = MASTER_TILES.map(t => t.id);
        expect(ids).toEqual(['math', 'english', 'braintraining', 'exam', 'lqchamp']);
        expect(DEFAULT_MASTER_TILES.exam).toBe(true);
        expect(DEFAULT_MASTER_TILES.math).toBe(true);
    });

    it('loads default master tiles when storage is empty', async () => {
        const config = await loadMasterTilesConfig();
        expect(config.math).toBe(true);
        expect(config.english).toBe(true);
        expect(config.braintraining).toBe(true);
        expect(config.exam).toBe(true);
        expect(config.lqchamp).toBe(true);
    });

    it('merges stored overrides (e.g. exam: false)', async () => {
        await storage.set('learning-galaxy-master-tiles', JSON.stringify({ exam: false }));
        const config = await loadMasterTilesConfig();
        expect(config.exam).toBe(false);
        expect(config.math).toBe(true);
        expect(config.english).toBe(true);
    });

    it('saves master tiles configuration to storage', async () => {
        await saveMasterTilesConfig({
            math: true,
            english: true,
            braintraining: true,
            exam: false,
            lqchamp: true
        });

        const stored = await storage.get('learning-galaxy-master-tiles');
        expect(stored).toBeDefined();
        const parsed = JSON.parse(typeof stored === 'string' ? stored : (stored as any).value);
        expect(parsed.exam).toBe(false);
    });
});
