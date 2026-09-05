// Storage abstraction for cross-platform compatibility
// Works with localStorage and native mobile storage

// Define window.storage interface if needed
declare global {
    interface Window {
        storage?: {
            get: (key: string) => Promise<string | null>;
            set: (key: string, value: string) => Promise<void>;
            remove: (key: string) => Promise<void>;
            clear: () => Promise<void>;
        };
    }
}

export const storage = {
    get: async (key: string): Promise<string | null> => {
        try {
            // Try native mobile storage first
            if (window.storage?.get) {
                return await window.storage.get(key);
            }

            // Fallback to localStorage
            // Note: localStorage is synchronous, but we wrap in async for API consistency
            return localStorage.getItem(key);
        } catch (e) {
            console.error(`Storage get error for key "${key}":`, e);
            return null;
        }
    },

    set: async (key: string, value: string): Promise<void> => {
        try {
            // Try native mobile storage first
            if (window.storage?.set) {
                await window.storage.set(key, value);
                return;
            }

            // Fallback to localStorage
            localStorage.setItem(key, value);
        } catch (e) {
            console.error(`Storage set error for key "${key}":`, e);
        }
    },

    remove: async (key: string): Promise<void> => {
        try {
            // Try native mobile storage first
            if (window.storage?.remove) {
                await window.storage.remove(key);
                return;
            }

            // Fallback to localStorage
            localStorage.removeItem(key);
        } catch (e) {
            console.error(`Storage remove error for key "${key}":`, e);
        }
    },

    clear: async (): Promise<void> => {
        try {
            // Try native mobile storage first
            if (window.storage?.clear) {
                await window.storage.clear();
                return;
            }

            // Fallback to localStorage
            localStorage.clear();
        } catch (e) {
            console.error('Storage clear error:', e);
        }
    },
};

export default storage;
