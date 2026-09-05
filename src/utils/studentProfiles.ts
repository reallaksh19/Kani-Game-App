import { StudentProfile } from '../types';
import { storage } from './storage';

export interface AvatarOption {
    id: string;
    emoji: string;
    title: string;
    trait: string;
    color: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
    { id: 'unicorn', emoji: '🦄', title: 'Cosmic Unicorn', trait: 'Creative Genius', color: 'from-pink-500 to-purple-500' },
    { id: 'rocket', emoji: '🚀', title: 'Stellar Rocket', trait: 'Speedy Explorer', color: 'from-blue-500 to-indigo-600' },
    { id: 'cat', emoji: '🐱', title: 'Galaxy Kitten', trait: 'Curious Detective', color: 'from-amber-400 to-orange-500' },
    { id: 'lion', emoji: '🦁', title: 'Brave Lion', trait: 'Champion Thinker', color: 'from-yellow-500 to-amber-600' },
    { id: 'panda', emoji: '🐼', title: 'Zen Panda', trait: 'Calm Problem Solver', color: 'from-emerald-400 to-teal-600' },
    { id: 'fox', emoji: '🦊', title: 'Swift Fox', trait: 'Clever Strategist', color: 'from-orange-500 to-red-600' },
    { id: 'dragon', emoji: '🐲', title: 'Star Dragon', trait: 'Fire Logic Master', color: 'from-red-500 to-rose-700' },
    { id: 'dolphin', emoji: '🐬', title: 'Cosmic Dolphin', trait: 'Wonder Thinker', color: 'from-cyan-400 to-blue-600' },
    { id: 'astronaut', emoji: '🧑‍🚀', title: 'Astro Cadet', trait: 'Galaxy Pilot', color: 'from-purple-500 to-violet-700' },
    { id: 'star', emoji: '⭐', title: 'Super Star', trait: 'Radiant Champ', color: 'from-yellow-400 to-amber-500' },
    { id: 'puppy', emoji: '🐶', title: 'Space Pup', trait: 'Loyal Learner', color: 'from-amber-500 to-orange-600' },
    { id: 'owl', emoji: '🦉', title: 'Cosmic Owl', trait: 'Wise Mind', color: 'from-indigo-400 to-purple-600' }
];

const PROFILES_STORAGE_KEY = 'learning-galaxy-student-profiles';
const ACTIVE_STUDENT_STORAGE_KEY = 'learning-galaxy-active-student-id';

// Load all saved profiles
export const loadStudentProfiles = async (): Promise<StudentProfile[]> => {
    try {
        const raw = await storage.get(PROFILES_STORAGE_KEY);
        if (!raw) return [];
        const value = typeof raw === 'string' ? raw : (raw as any).value;
        if (!value) return [];
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error('Failed to load student profiles', e);
        return [];
    }
};

// Save profiles
export const saveStudentProfiles = async (profiles: StudentProfile[]): Promise<void> => {
    try {
        await storage.set(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    } catch (e) {
        console.error('Failed to save student profiles', e);
    }
};

// Get active student ID
export const getActiveStudentId = async (): Promise<string | null> => {
    try {
        const raw = await storage.get(ACTIVE_STUDENT_STORAGE_KEY);
        if (!raw) return null;
        return typeof raw === 'string' ? raw : (raw as any).value || null;
    } catch {
        return null;
    }
};

// Set active student ID
export const setActiveStudentId = async (id: string | null): Promise<void> => {
    try {
        if (id === null) {
            await storage.set(ACTIVE_STUDENT_STORAGE_KEY, '');
        } else {
            await storage.set(ACTIVE_STUDENT_STORAGE_KEY, id);
        }
    } catch (e) {
        console.error('Failed to set active student', e);
    }
};

// Create a new student profile
export const createStudentProfile = (
    name: string,
    avatarEmoji: string = '🦄',
    grade: string = 'Grade 4'
): StudentProfile => {
    const trimmed = name.trim();
    const cleanName = trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1) : 'Cadet';
    const id = `student_${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now()}`;
    const now = new Date().toISOString();

    return {
        id,
        name: cleanName,
        avatar: avatarEmoji,
        grade,
        createdAt: now,
        lastLoginAt: now
    };
};
