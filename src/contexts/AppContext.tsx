import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { Settings, LeaderboardEntry, Question, StudentProfile, SessionLog } from '../types';
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
import {
    loadStudentProfiles,
    saveStudentProfiles,
    getActiveStudentId,
    setActiveStudentId,
    createStudentProfile
} from '../utils/studentProfiles';
import {
    startSessionLog,
    updateSessionLog
} from '../utils/sessionLogger';

// Randomized question order is the product default from this release onward.
const APP_DEFAULT_SETTINGS: Settings = {
    ...DEFAULT_SETTINGS,
    randomize: true,
};
const RANDOMIZE_DEFAULT_MIGRATION_KEY = 'learning-galaxy-randomize-default-v1';

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
    activeStudent: StudentProfile | null;
    studentProfiles: StudentProfile[];
    activeSession: SessionLog | null;
    selectStudent: (student: StudentProfile | null) => Promise<void>;
    createStudent: (name: string, avatar?: string, grade?: string) => Promise<StudentProfile>;
    deleteStudent: (studentId: string) => Promise<void>;
    recordGameActivity: (stars: number) => Promise<void>;
    loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Settings>(APP_DEFAULT_SETTINGS);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [playerStats, setPlayerStats] = useState<PlayerStats>(DEFAULT_PLAYER_STATS);
    const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>([]);
    const [activeStudent, setActiveStudent] = useState<StudentProfile | null>(null);
    const [activeSession, setActiveSession] = useState<SessionLog | null>(null);
    const [loading, setLoading] = useState(true);
    const sessionStartTimeRef = useRef<number>(Date.now());

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                // Load Master Tiles config (from public/data/master_tiles.json + storage)
                const masterTiles = await loadMasterTilesConfig();

                // Load Settings
                let mergedSettings: Settings = {
                    ...APP_DEFAULT_SETTINGS,
                    enabledMasterTiles: masterTiles
                };

                const settingsData = await storage.get('learning-galaxy-settings');
                if (settingsData) {
                    const parsed = JSON.parse(settingsData);
                    mergedSettings = {
                        ...APP_DEFAULT_SETTINGS,
                        ...parsed,
                        enabledMasterTiles: {
                            ...masterTiles,
                            ...(parsed.enabledMasterTiles || {})
                        }
                    };
                }

                // Older builds shipped randomize=false as the default. Apply the new
                // default exactly once, then preserve every user toggle after that.
                const randomizeDefaultMigrated = await storage.get(RANDOMIZE_DEFAULT_MIGRATION_KEY);
                if (!randomizeDefaultMigrated) {
                    mergedSettings = { ...mergedSettings, randomize: true };
                    await storage.set('learning-galaxy-settings', JSON.stringify(mergedSettings));
                    await storage.set(RANDOMIZE_DEFAULT_MIGRATION_KEY, '1');
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

                // Load Student Profiles
                const profiles = await loadStudentProfiles();
                setStudentProfiles(profiles);

                const activeId = await getActiveStudentId();
                let active = profiles.find(p => p.id === activeId) || null;
                if (!active && profiles.length === 1) {
                    active = profiles[0];
                    await setActiveStudentId(active.id);
                }
                if (active) {
                    setActiveStudent(active);
                    sessionStartTimeRef.current = Date.now();
                    const sess = await startSessionLog(
                        active.name,
                        active.avatar,
                        mergedSettings.disableAnalyticsInProduction ?? true
                    );
                    setActiveSession(sess);
                }
            } catch (e) {
                console.error('Failed to load data', e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Heartbeat every 30s to update session duration
    useEffect(() => {
        if (!activeSession) return;

        const interval = setInterval(() => {
            const elapsed = Math.max(1, Math.floor((Date.now() - sessionStartTimeRef.current) / 1000));
            updateSessionLog(activeSession, { durationSeconds: elapsed }).then(updated => {
                setActiveSession(updated);
            }).catch(() => {});
        }, 30000);

        return () => clearInterval(interval);
    }, [activeSession]);

    const updateSettings = async (newSettings: Settings) => {
        // SettingsPage's Reset action passes the shared DEFAULT_SETTINGS object.
        // Normalize that reset to the current product defaults.
        const normalizedSettings = newSettings === DEFAULT_SETTINGS
            ? APP_DEFAULT_SETTINGS
            : newSettings;
        setSettings(normalizedSettings);
        await storage.set('learning-galaxy-settings', JSON.stringify(normalizedSettings));
        await storage.set(RANDOMIZE_DEFAULT_MIGRATION_KEY, '1');
        if (normalizedSettings.enabledMasterTiles) {
            await saveMasterTilesConfig(normalizedSettings.enabledMasterTiles);
        }
    };

    const recordGameActivity = async (stars: number) => {
        if (activeSession) {
            const elapsed = Math.max(1, Math.floor((Date.now() - sessionStartTimeRef.current) / 1000));
            const updated = await updateSessionLog(activeSession, {
                durationSeconds: elapsed,
                addGames: 1,
                addStars: stars
            });
            setActiveSession(updated);
        }
        if (activeStudent) {
            const updatedStudent: StudentProfile = {
                ...activeStudent,
                lastLoginAt: new Date().toISOString()
            };
            const updatedProfiles = studentProfiles.map(p => p.id === updatedStudent.id ? updatedStudent : p);
            setActiveStudent(updatedStudent);
            setStudentProfiles(updatedProfiles);
            await saveStudentProfiles(updatedProfiles);
        }
    };

    const addLeaderboardEntry = async (entry: LeaderboardEntry) => {
        const resolvedName = (entry.name && entry.name !== 'Cadet')
            ? entry.name
            : (activeStudent?.name || entry.name || 'Cadet');
        const resolvedEntry: LeaderboardEntry = {
            ...entry,
            name: resolvedName
        };
        const updated = [...leaderboard, resolvedEntry];
        setLeaderboard(updated);
        await storage.set('learning-galaxy-leaderboard', JSON.stringify(updated));
        await recordGameActivity(resolvedEntry.stars || 0);
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

    const selectStudent = async (student: StudentProfile | null) => {
        if (activeSession) {
            const elapsed = Math.max(1, Math.floor((Date.now() - sessionStartTimeRef.current) / 1000));
            await updateSessionLog(activeSession, { durationSeconds: elapsed });
        }

        if (!student) {
            setActiveStudent(null);
            await setActiveStudentId(null);
            setActiveSession(null);
            return;
        }

        setActiveStudent(student);
        await setActiveStudentId(student.id);
        sessionStartTimeRef.current = Date.now();
        const newSession = await startSessionLog(
            student.name,
            student.avatar,
            settings.disableAnalyticsInProduction ?? true
        );
        setActiveSession(newSession);
    };

    const createStudent = async (name: string, avatar?: string, grade?: string): Promise<StudentProfile> => {
        const newProfile = createStudentProfile(name, avatar, grade);
        const updated = [...studentProfiles, newProfile];
        setStudentProfiles(updated);
        await saveStudentProfiles(updated);
        await selectStudent(newProfile);
        return newProfile;
    };

    const deleteStudent = async (studentId: string) => {
        const updated = studentProfiles.filter(p => p.id !== studentId);
        setStudentProfiles(updated);
        await saveStudentProfiles(updated);
        if (activeStudent?.id === studentId) {
            await selectStudent(null);
        }
    };

    const value = useMemo(() => ({
        settings,
        updateSettings,
        leaderboard,
        addLeaderboardEntry,
        playerStats,
        recordLotCompletion,
        activeStudent,
        studentProfiles,
        activeSession,
        selectStudent,
        createStudent,
        deleteStudent,
        recordGameActivity,
        loading
    }), [
        settings,
        leaderboard,
        playerStats,
        activeStudent,
        studentProfiles,
        activeSession,
        loading
    ]);

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
