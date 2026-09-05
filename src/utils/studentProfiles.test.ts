import { describe, it, expect, beforeEach } from 'vitest';
import {
    AVATAR_OPTIONS,
    createStudentProfile,
    loadStudentProfiles,
    saveStudentProfiles,
    getActiveStudentId,
    setActiveStudentId
} from './studentProfiles';

describe('studentProfiles utility', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('contains 12 kid-friendly avatar options including unicorn and rocket', () => {
        expect(AVATAR_OPTIONS.length).toBe(12);
        const ids = AVATAR_OPTIONS.map(a => a.id);
        expect(ids).toContain('unicorn');
        expect(ids).toContain('rocket');
        expect(ids).toContain('astronaut');
        expect(ids).toContain('panda');
    });

    it('creates a new student profile with capitalized name and timestamp', () => {
        const profile = createStudentProfile('kani', '🦄', 'Grade 4');
        expect(profile.name).toBe('Kani');
        expect(profile.avatar).toBe('🦄');
        expect(profile.grade).toBe('Grade 4');
        expect(profile.id).toContain('student_kani_');
        expect(profile.createdAt).toBeDefined();
        expect(profile.lastLoginAt).toBeDefined();
    });

    it('handles empty name by falling back to Cadet', () => {
        const profile = createStudentProfile('', '🚀');
        expect(profile.name).toBe('Cadet');
        expect(profile.avatar).toBe('🚀');
    });

    it('saves and loads multiple student profiles accurately', async () => {
        const profile1 = createStudentProfile('Kani', '🦄', 'Grade 4');
        const profile2 = createStudentProfile('Leo', '🚀', 'Grade 3');

        await saveStudentProfiles([profile1, profile2]);
        const loaded = await loadStudentProfiles();

        expect(loaded.length).toBe(2);
        expect(loaded[0].name).toBe('Kani');
        expect(loaded[1].name).toBe('Leo');
    });

    it('saves and retrieves active student id', async () => {
        expect(await getActiveStudentId()).toBeNull();
        await setActiveStudentId('student_kani_123');
        expect(await getActiveStudentId()).toBe('student_kani_123');

        await setActiveStudentId(null);
        expect(await getActiveStudentId()).toBeNull();
    });
});
