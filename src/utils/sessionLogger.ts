import { SessionLog } from '../types';
import { storage } from './storage';

const SESSIONS_STORAGE_KEY = 'learning-galaxy-sessions';

// Resolve IP address with child privacy protection
export const resolveClientIp = async (disableAnalytics: boolean = true): Promise<string> => {
    // 1. If analytics disabled (e.g. deployment mode / child privacy), do not call any external IP resolver
    if (disableAnalytics) {
        return 'client-protected';
    }

    // 2. In local dev environment
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return '127.0.0.1 (local)';
    }

    // 3. Fallback online resolution if parent explicitly allowed external analytics
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
            const data = await res.json();
            return data.ip || 'online-device';
        }
    } catch {
        // Silently fall back
    }

    return 'device-offline';
};

// Create a new session log
export const startSessionLog = async (
    studentName: string,
    studentAvatar: string,
    disableAnalytics: boolean = true
): Promise<SessionLog> => {
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    const ipAddress = await resolveClientIp(disableAnalytics);

    const deviceInfo = typeof window !== 'undefined'
        ? `${window.innerWidth}x${window.innerHeight} (${navigator.userAgent?.split(' ')[0] || 'Browser'})`
        : 'Desktop';

    const newSession: SessionLog = {
        sessionId,
        studentName,
        studentAvatar,
        loginTime: now,
        lastActiveTime: now,
        durationSeconds: 0,
        ipAddress,
        deviceInfo,
        gamesPlayed: 0,
        starsEarned: 0
    };

    await saveSessionLog(newSession);
    return newSession;
};

// Update existing session log (heartbeat & game increments)
export const updateSessionLog = async (
    currentSession: SessionLog,
    updates: { durationSeconds?: number; addGames?: number; addStars?: number }
): Promise<SessionLog> => {
    const updated: SessionLog = {
        ...currentSession,
        lastActiveTime: new Date().toISOString(),
        durationSeconds: updates.durationSeconds !== undefined ? updates.durationSeconds : currentSession.durationSeconds,
        gamesPlayed: currentSession.gamesPlayed + (updates.addGames || 0),
        starsEarned: currentSession.starsEarned + (updates.addStars || 0)
    };

    await saveSessionLog(updated);
    return updated;
};

// Save session record to storage and sync to /api/log-session (writes to public/data/sessions.json)
export const saveSessionLog = async (session: SessionLog): Promise<void> => {
    // 1. Local Storage persistence
    try {
        const existing = await loadLocalSessions();
        const idx = existing.findIndex(s => s.sessionId === session.sessionId);
        let updatedList: SessionLog[];
        if (idx >= 0) {
            updatedList = [...existing];
            updatedList[idx] = session;
        } else {
            updatedList = [session, ...existing];
        }
        if (updatedList.length > 100) updatedList = updatedList.slice(0, 100);
        await storage.set(SESSIONS_STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
        console.error('Failed to save session to local storage', e);
    }

    // 2. Sync to Vite dev server endpoint (writes to public/data/sessions.json on disk)
    try {
        await fetch('/api/log-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(session)
        });
    } catch {
        // Ignore network errors in static host / offline
    }
};

// Load sessions stored in local storage
export const loadLocalSessions = async (): Promise<SessionLog[]> => {
    try {
        const raw = await storage.get(SESSIONS_STORAGE_KEY);
        if (!raw) return [];
        const val = typeof raw === 'string' ? raw : (raw as any).value;
        if (!val) return [];
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

// Load merged session history (public/data/sessions.json + local storage)
export const loadSessionHistory = async (): Promise<SessionLog[]> => {
    const local = await loadLocalSessions();

    try {
        const baseUrl = import.meta.env.BASE_URL || '/';
        const url = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}data/sessions.json`;
        const res = await fetch(url, { cache: 'no-cache' });
        if (res.ok) {
            const publicData = await res.json();
            if (Array.isArray(publicData)) {
                // Merge by sessionId
                const sessionMap = new Map<string, SessionLog>();
                publicData.forEach(s => sessionMap.set(s.sessionId, s));
                local.forEach(s => sessionMap.set(s.sessionId, s));
                return Array.from(sessionMap.values()).sort(
                    (a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime()
                );
            }
        }
    } catch {
        // Fall back to local
    }

    return local;
};
