import { storage } from './storage';
import defaultMasterTiles from '../../public/data/master_tiles.json';

export type MasterTileId = 'math' | 'english' | 'braintraining' | 'exam' | 'lqchamp';

export interface MasterTileConfig {
    id: MasterTileId;
    title: string;
    icon: string;
    badgeCount: number;
    badgeLabel: string;
    description: string;
    gradient: string;
    border: string;
    glow: string;
    ringColor: string;
}

export const MASTER_TILES: MasterTileConfig[] = [
    {
        id: 'math',
        title: 'Math',
        icon: '🔢',
        badgeCount: 12,
        badgeLabel: '12 fun games!',
        description: 'Arithmetic, fractions, time, money & geometry',
        gradient: 'from-purple-500 via-purple-600 to-indigo-700',
        border: 'border-purple-400/30',
        glow: 'hover:scale-105',
        ringColor: 'focus-visible:ring-purple-400'
    },
    {
        id: 'english',
        title: 'English',
        icon: '📚',
        badgeCount: 17,
        badgeLabel: '17 fun games!',
        description: 'Grammar, vocabulary & comprehension quests',
        gradient: 'from-blue-500 via-blue-600 to-cyan-700',
        border: 'border-blue-400/30',
        glow: 'hover:scale-105',
        ringColor: 'focus-visible:ring-blue-400'
    },
    {
        id: 'braintraining',
        title: 'Brain Training',
        icon: '🧠',
        badgeCount: 16,
        badgeLabel: '16 skill games!',
        description: 'Memory, logic, patterns & spatial thinking',
        gradient: 'from-pink-500 via-fuchsia-500 to-purple-600',
        border: 'border-pink-400/30',
        glow: 'hover:scale-105',
        ringColor: 'focus-visible:ring-pink-400'
    },
    {
        id: 'exam',
        title: 'Exam',
        icon: '📝',
        badgeCount: 1,
        badgeLabel: '1 tests!',
        description: 'Timed fraction tests & practice assessments',
        gradient: 'from-blue-600 via-indigo-600 to-violet-700',
        border: 'border-blue-400/30',
        glow: 'hover:scale-105',
        ringColor: 'focus-visible:ring-blue-400'
    },
    {
        id: 'lqchamp',
        title: 'LQ Champ',
        icon: '🏆',
        badgeCount: 5,
        badgeLabel: '5 Olympiad lots!',
        description: 'Grade 4 Olympiad thinksheets (Lots 1-5)',
        gradient: 'from-amber-500 via-orange-500 to-rose-600',
        border: 'border-amber-400/30',
        glow: 'hover:scale-105',
        ringColor: 'focus-visible:ring-amber-400'
    }
];

export const DEFAULT_MASTER_TILES: Record<string, boolean> = {
    math: true,
    english: true,
    braintraining: true,
    exam: true,
    lqchamp: true,
    ...(defaultMasterTiles as Record<string, boolean>)
};

const MASTER_TILES_STORAGE_KEY = 'learning-galaxy-master-tiles';

// Load master tiles config: reads public/data/master_tiles.json first, then merges local storage overrides
export const loadMasterTilesConfig = async (): Promise<Record<string, boolean>> => {
    let baseConfig: Record<string, boolean> = { ...DEFAULT_MASTER_TILES };

    // 1. Attempt to fetch public/data/master_tiles.json at runtime
    try {
        const baseUrl = import.meta.env.BASE_URL || '/';
        const url = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}data/master_tiles.json`;
        const res = await fetch(url, { cache: 'no-cache' });
        if (res.ok) {
            const json = await res.json();
            baseConfig = { ...baseConfig, ...json };
        }
    } catch {
        // Fall back to bundled default
    }

    // 2. Check local storage overrides
    try {
        const stored = await storage.get(MASTER_TILES_STORAGE_KEY);
        if (stored) {
            const rawVal = typeof stored === 'string' ? stored : (stored as any).value;
            if (rawVal) {
                const parsed = JSON.parse(rawVal);
                return { ...baseConfig, ...parsed };
            }
        }
    } catch {
        // Ignore JSON parse errors
    }

    return baseConfig;
};

// Save master tiles config: saves to local storage and syncs to /api/save-master-tiles (for Vite dev)
export const saveMasterTilesConfig = async (config: Record<string, boolean>): Promise<void> => {
    try {
        await storage.set(MASTER_TILES_STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
        console.error('Failed to save master tiles to local storage', e);
    }

    // In dev mode, write directly to public/data/master_tiles.json via Vite middleware
    try {
        await fetch('/api/save-master-tiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config, null, 2)
        });
    } catch {
        // Production static host ignores or 404s this fetch silently
    }
};
