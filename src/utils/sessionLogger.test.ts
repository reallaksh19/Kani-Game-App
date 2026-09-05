import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    resolveClientIp,
    startSessionLog,
    updateSessionLog,
    saveSessionLog,
    loadLocalSessions
} from './sessionLogger';

describe('sessionLogger utility', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it('returns "client-protected" when analytics is disabled (deployment / child privacy mode)', async () => {
        const ip = await resolveClientIp(true);
        expect(ip).toBe('client-protected');
    });

    it('resolves local IP in local dev mode when analytics allowed', async () => {
        const ip = await resolveClientIp(false);
        expect(typeof ip).toBe('string');
        expect(ip.length).toBeGreaterThan(0);
    });

    it('creates a new session log with zero starting duration and games', async () => {
        const session = await startSessionLog('Kani', '🦄', true);

        expect(session.sessionId).toContain('sess_');
        expect(session.studentName).toBe('Kani');
        expect(session.studentAvatar).toBe('🦄');
        expect(session.ipAddress).toBe('client-protected');
        expect(session.durationSeconds).toBe(0);
        expect(session.gamesPlayed).toBe(0);
        expect(session.starsEarned).toBe(0);
        expect(session.loginTime).toBeDefined();
    });

    it('updates existing session log with duration, games and stars', async () => {
        const initial = await startSessionLog('Leo', '🚀', true);
        const updated = await updateSessionLog(initial, {
            durationSeconds: 45,
            addGames: 2,
            addStars: 10
        });

        expect(updated.sessionId).toBe(initial.sessionId);
        expect(updated.durationSeconds).toBe(45);
        expect(updated.gamesPlayed).toBe(2);
        expect(updated.starsEarned).toBe(10);
    });

    it('persists session logs to local storage and retrieves them', async () => {
        const session = await startSessionLog('Maya', '🐱', true);
        await saveSessionLog(session);

        const loaded = await loadLocalSessions();
        expect(loaded.some(s => s.sessionId === session.sessionId)).toBe(true);
        const found = loaded.find(s => s.sessionId === session.sessionId);
        expect(found?.studentName).toBe('Maya');
    });
});
