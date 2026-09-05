import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Settings, LeaderboardEntry, Question } from '../types';
import { DEFAULT_SETTINGS } from '../data/gameDefinitions';
import {
    PlayerStats,
    DEFAULT_PLAYER_STATS,
    loadPlayerStats,
    savePlayerStats,
    recordLotSession,
    Badge
} from '../utils/playerStats';
import {
    loadMasterTilesConfig,
    saveMasterTilesConfig
} from '../utils/masterTiles';

// Storage helper
const storage = {
    get: async (key: string) => {
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    },
    set: async (key: string, value: string) => {
        try {
            localStorage.setItem(key, value);
        } catch {
            // Ignore storage errors
        }
    }
};

interface AppContextType {
    settings: Settings;
    updateSettings: (newSettings: Settings) => Promise<void>;
    leaderboard: LeaderboardEntry[];
    addLeaderboardEntry: (entry: LeaderboardEntry) => Promise<void>;
    playerStats: PlayerStats;
    recordLotCompletion: (
        lotId: string,
        questions: Question[],
        answers: Record<number, { selected: string; isCorrect: boolean }>,
        durationSeconds: number,
        starsEarned: number,
        maxStreak: number
    ) => Promise<Badge[]>;
    loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [playerStats, setPlayerStats] = useState<PlayerStats>(DEFAULT_PLAYER_STATS);
    const [loading, setLoading] = useState(true);

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                // Load Master Tiles config (from public/data/master_tiles.json + storage)
                const masterTiles = await loadMasterTilesConfig();

                // Load Settings
                let mergedSettings: Settings = {
                    ...DEFAULT_SETTINGS,
                    enabledMasterTiles: masterTiles
                };

                const settingsData = await storage.get('learning-galaxy-settings');
                if (settingsData) {
                    const parsed = JSON.parse(settingsData);
                    mergedSettings = {
                        ...DEFAULT_SETTINGS,
                        ...parsed,
                        enabledMasterTiles: {
                            ...masterTiles,
                            ...(parsed.enabledMasterTiles || {})
                        }
                    };
                }
                setSettings(mergedSettings);

                // Load Leaderboard
                const leaderboardData = await storage.get('learning-galaxy-leaderboard');
                if (leaderboardData) {
                    setLeaderboard(JSON.parse(leaderboardData));
                }

                // Load Player Stats
                const loadedStats = await loadPlayerStats();
                setPlayerStats(loadedStats);
            } catch (e) {
                console.error('Failed to load data', e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const updateSettings = async (newSettings: Settings) => {
        setSettings(newSettings);
        await storage.set('learning-galaxy-settings', JSON.stringify(newSettings));
        if (newSettings.enabledMasterTiles) {
            await saveMasterTilesConfig(newSettings.enabledMasterTiles);
        }
    };

    const addLeaderboardEntry = async (entry: LeaderboardEntry) => {
        const updated = [...leaderboard, entry];
        setLeaderboard(updated);
        await storage.set('learning-galaxy-leaderboard', JSON.stringify(updated));
    };

    const recordLotCompletion = async (
        lotId: string,
        questions: Question[],
        answers: Record<number, { selected: string; isCorrect: boolean }>,
        durationSeconds: number,
        starsEarned: number,
        maxStreak: number
    ): Promise<Badge[]> => {
        const { updatedStats, newBadges } = recordLotSession(
            playerStats,
            lotId,
            questions,
            answers,
            durationSeconds,
            starsEarned,
            maxStreak
        );
        setPlayerStats(updatedStats);
        await savePlayerStats(updatedStats);
        return newBadges;
    };

    const value = useMemo(() => ({
        settings,
        updateSettings,
        leaderboard,
        addLeaderboardEntry,
        playerStats,
        recordLotCompletion,
        loading
    }), [settings, leaderboard, playerStats, loading]);

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
