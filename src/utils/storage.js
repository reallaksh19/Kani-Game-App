// Storage abstraction for cross-platform compatibility
// Works with localStorage and native mobile storage

export const storage = {
  get: async (key) => {
    try {
      // Try native mobile storage first
      if (window.storage?.get) {
        return await window.storage.get(key);
      }

      // Fallback to localStorage
      const value = localStorage.getItem(key);
      return value ? { value } : null;
    } catch (e) {
      console.error(`Storage get error for key "${key}":`, e);
      return null;
    }
  },

  set: async (key, value) => {
    try {
      // Try native mobile storage first
      if (window.storage?.set) {
        return await window.storage.set(key, value);
      }

      // Fallback to localStorage
      localStorage.setItem(key, value);
    } catch (e) {
      console.error(`Storage set error for key "${key}":`, e);
    }
  },

  remove: async (key) => {
    try {
      // Try native mobile storage first
      if (window.storage?.remove) {
        return await window.storage.remove(key);
      }

      // Fallback to localStorage
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Storage remove error for key "${key}":`, e);
    }
  },

  clear: async () => {
    try {
      // Try native mobile storage first
      if (window.storage?.clear) {
        return await window.storage.clear();
      }

      // Fallback to localStorage
      localStorage.clear();
    } catch (e) {
      console.error('Storage clear error:', e);
    }
  },
};

export default storage;
