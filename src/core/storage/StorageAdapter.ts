/**
 * Storage adapter for browser extension storage
 * Provides a typed interface to chrome.storage.sync with robust timeout handling
 * and safe fallback to localStorage where available
 */

import type {
  StorageSchema,
  StorageKey,
  StorageChangeCallback,
} from '../../shared/types/Storage.types';
import browser from 'webextension-polyfill';

export class StorageAdapter {
  private static changeListeners: Map<StorageKey, Set<StorageChangeCallback>> = new Map();

  /**
   * Safe check for localStorage availability
   */
  private static getLocalStorage(): Storage | null {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return globalThis.localStorage;
    }
    return null;
  }

  /**
   * Get a value from storage with timeout protection and fallback
   */
  static async get<K extends StorageKey>(key: K): Promise<StorageSchema[K] | null> {
    try {
      // Add timeout to storage call to prevent infinite hanging
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Storage timeout for key: ${key}`)), 1500)
      );

      // Use Promise.race to fail fast if storage API hangs
      const result = (await Promise.race([browser.storage.sync.get(key), timeout])) as Record<
        string,
        any
      >;

      if (result && result[key] !== undefined) {
        return result[key];
      }

      // Fallback to localStorage if available and key is missing in sync storage
      const local = this.getLocalStorage();
      if (local) {
        const item = local.getItem(key);
        if (item) {
          try {
            return JSON.parse(item);
          } catch (e) {
            console.warn(`[TW Storage] Error parsing localStorage key ${key}:`, e);
          }
        }
      }

      return null;
    } catch (error) {
      console.warn(`[TW Storage] Error getting ${key}:`, error);

      // Emergency fallback on error
      const local = this.getLocalStorage();
      if (local) {
        const item = local.getItem(key);
        if (item) {
          try {
            return JSON.parse(item);
          } catch (e) {
            // Ignore parse errors
          }
        }
      }

      // Return null instead of throwing to prevent UI freezes
      return null;
    }
  }

  /**
   * Set a value in storage with timeout protection and backup
   */
  static async set<K extends StorageKey>(key: K, value: StorageSchema[K]): Promise<boolean> {
    try {
      // Backup to localStorage first if available (synchronous and fast)
      const local = this.getLocalStorage();
      if (local) {
        try {
          local.setItem(key, JSON.stringify(value));
        } catch (e) {
          console.warn(`[TW Storage] Error writing to localStorage for ${key}:`, e);
        }
      }

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Storage set timeout for key: ${key}`)), 1500)
      );

      await Promise.race([browser.storage.sync.set({ [key]: value }), timeout]);

      return true;
    } catch (error) {
      console.error(`[TW Storage] Error setting ${key}:`, error);
      return false;
    }
  }

  /**
   * Remove a key from storage
   */
  static async remove(key: StorageKey): Promise<boolean> {
    try {
      // Remove from localStorage if available
      const local = this.getLocalStorage();
      if (local) {
        local.removeItem(key);
      }

      await browser.storage.sync.remove(key);
      return true;
    } catch (error) {
      console.error(`[TW Storage] Error removing ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all storage
   */
  static async clear(): Promise<boolean> {
    try {
      const local = this.getLocalStorage();
      if (local) {
        local.clear();
      }

      await browser.storage.sync.clear();
      return true;
    } catch (error) {
      console.error('[TW Storage] Error clearing storage:', error);
      return false;
    }
  }

  /**
   * Get multiple values from storage
   */
  static async getMultiple<K extends StorageKey>(keys: K[]): Promise<Partial<StorageSchema>> {
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Storage getMultiple timeout')), 1500)
      );

      const result = (await Promise.race([
        browser.storage.sync.get(keys),
        timeout,
      ])) as Partial<StorageSchema>;

      // Fill in missing keys from localStorage if available
      if (result) {
        const local = this.getLocalStorage();
        if (local) {
          keys.forEach((key) => {
            if (result[key] === undefined) {
              const item = local.getItem(key);
              if (item) {
                try {
                  result[key] = JSON.parse(item);
                } catch (e) {
                  // Ignore
                }
              }
            }
          });
        }
      }

      return result || {};
    } catch (error) {
      console.error('[TW Storage] Error getting multiple values:', error);
      return {};
    }
  }

  /**
   * Set multiple values in storage
   */
  static async setMultiple(values: Partial<StorageSchema>): Promise<boolean> {
    try {
      // Backup to localStorage
      const local = this.getLocalStorage();
      if (local) {
        Object.entries(values).forEach(([key, value]) => {
          try {
            local.setItem(key, JSON.stringify(value));
          } catch (e) {
            // Ignore
          }
        });
      }

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Storage setMultiple timeout')), 1500)
      );

      await Promise.race([browser.storage.sync.set(values), timeout]);

      return true;
    } catch (error) {
      console.error('[TW Storage] Error setting multiple values:', error);
      return false;
    }
  }

  /**
   * Listen for changes to a specific key
   */
  static onChange<K extends StorageKey>(
    key: K,
    callback: StorageChangeCallback<StorageSchema[K]>
  ): () => void {
    if (!this.changeListeners.has(key)) {
      this.changeListeners.set(key, new Set());
    }

    const listeners = this.changeListeners.get(key)!;
    // Cast necessary because Set<StorageChangeCallback> is generic but here we need specific
    listeners.add(callback as any);

    // Return unsubscribe function
    return () => {
      listeners.delete(callback as any);
      if (listeners.size === 0) {
        this.changeListeners.delete(key);
      }
    };
  }

  /**
   * Initialize storage change listener
   * Should be called once at startup
   */
  static initializeChangeListener(): void {
    // Safety check for browser environment
    if (typeof browser === 'undefined' || !browser.storage) return;

    try {
      if (!browser.storage.onChanged.hasListener(this.handleStorageChange)) {
        browser.storage.onChanged.addListener(this.handleStorageChange);
      }
    } catch (e) {
      console.warn('[TW Storage] Failed to attach change listener:', e);
    }
  }

  private static handleStorageChange = (changes: Record<string, any>, areaName: string) => {
    if (areaName !== 'sync') return;

    for (const [key, change] of Object.entries(changes)) {
      const listeners = StorageAdapter.changeListeners.get(key as StorageKey);
      if (listeners) {
        listeners.forEach((callback) => {
          try {
            callback(
              {
                oldValue: change.oldValue,
                newValue: change.newValue,
              },
              key as StorageKey
            );
          } catch (e) {
            console.error(`[TW Storage] Error in change listener for ${key}:`, e);
          }
        });
      }
    }
  };

  /**
   * Get storage usage information
   */
  static async getUsage(): Promise<{ bytesInUse: number; quota: number }> {
    try {
      // Some polyfills don't support getBytesInUse, so we guard it
      if (browser.storage.sync.getBytesInUse) {
        const bytesInUse = await browser.storage.sync.getBytesInUse();
        const quota = 102400; // Standard Chrome sync quota
        return { bytesInUse, quota };
      }
      return { bytesInUse: 0, quota: 102400 };
    } catch (error) {
      console.error('[TW Storage] Error getting usage:', error);
      return { bytesInUse: 0, quota: 102400 };
    }
  }
}

// Initialize change listener immediately if possible
StorageAdapter.initializeChangeListener();
