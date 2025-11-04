/**
 * Browser-compatible store adapter
 *
 * This provides a localStorage-based implementation of the Electron store API
 * for when the app is running in a browser instead of Electron.
 */

import { ElectronStore } from '@/supafund/core/types/ElectronApi';

const STORE_KEY_PREFIX = 'pearl_store_';

/**
 * Browser store implementation using localStorage
 */
export const browserStore = {
  /**
   * Get the entire store as an object
   */
  store: async (): Promise<ElectronStore> => {
    const store: ElectronStore = {};
    const mutableStore = store as Record<string, unknown>;

    // Iterate through all localStorage keys with our prefix
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORE_KEY_PREFIX)) {
        const actualKey = key.slice(STORE_KEY_PREFIX.length);
        const value = localStorage.getItem(key);
        if (value !== null) {
          try {
            mutableStore[actualKey] = JSON.parse(value);
          } catch (e) {
            // If parsing fails, store as string
            mutableStore[actualKey] = value;
          }
        }
      }
    }

    return store;
  },

  /**
   * Get a value from the store
   */
  get: async (key: string): Promise<unknown> => {
    const storageKey = STORE_KEY_PREFIX + key;
    const value = localStorage.getItem(storageKey);

    if (value === null) {
      return undefined;
    }

    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  },

  /**
   * Set a value in the store
   */
  set: async (key: string, value: unknown): Promise<void> => {
    const storageKey = STORE_KEY_PREFIX + key;
    const serialized = JSON.stringify(value);
    localStorage.setItem(storageKey, serialized);
  },

  /**
   * Delete a value from the store
   */
  delete: async (key: string): Promise<void> => {
    const storageKey = STORE_KEY_PREFIX + key;
    localStorage.removeItem(storageKey);
  },

  /**
   * Clear the entire store
   */
  clear: async (): Promise<void> => {
    // Remove all keys with our prefix
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  },
};

/**
 * Check if we're running in a browser (not Electron)
 */
export const isBrowserEnvironment = (): boolean => {
  return typeof window !== 'undefined' && !('electronAPI' in window);
};
