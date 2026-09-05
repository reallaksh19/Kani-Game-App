import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Settings, LeaderboardEntry } from '../types';
import { DEFAULT_SETTINGS } from '../data/gameDefinitions';

// Storage helper
const storage = {
    get: async (key: string) => {
        try {
            if (window.storage?.get) return await window.storage.get(key);
            const value = localStorage.getItem(key);
            return value ? { value } : null;
        } catch (e) { return null; }
    },
    set: async (key: string, value: string) => {
        try {
            if (window.storage?.set) return await window.storage.set(key, value);
            localStorage.setItem(key, value);
        } catch (e) { }
    }
};

interface AppContextType {
    settings: Settings;
    updateSettings: (newSettings: Settings) => Promise<void>;
    leaderboard: LeaderboardEntry[];
    addLeaderboardEntry: (entry: LeaderboardEntry) => Promise<void>;
    loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                // Load Settings
                const settingsData = await storage.get('learning-galaxy-settings');
                if (settingsData) {
                    const value = typeof settingsData === 'string' ? settingsData : settingsData.value;
                    const parsed = JSON.parse(value);
                    // Merge with DEFAULT_SETTINGS to ensure new keys (like examSheetUrl) are present
                    setSettings({ ...DEFAULT_SETTINGS, ...parsed });
                }

                // Load Leaderboard
                const leaderboardData = await storage.get('learning-galaxy-leaderboard');
                if (leaderboardData) {
                    const value = typeof leaderboardData === 'string' ? leaderboardData : leaderboardData.value;
                    setLeaderboard(JSON.parse(value));
                }
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
    };

    const addLeaderboardEntry = async (entry: LeaderboardEntry) => {
        const updated = [...leaderboard, entry];
        setLeaderboard(updated);
        await storage.set('learning-galaxy-leaderboard', JSON.stringify(updated));
    };

    const value = useMemo(() => ({
        settings,
        updateSettings,
        leaderboard,
        addLeaderboardEntry,
        loading
    }), [settings, leaderboard, loading]);

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
