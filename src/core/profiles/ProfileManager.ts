/**
 * Profile manager for multi-profile support
 * Handles creation, switching, updating, and deletion of user sensitivity profiles.
 */

import type {
  Profile,
  ProfileCreateInput,
  ProfileUpdateInput,
} from '../../shared/types/Profile.types';
import { StorageAdapter } from '../storage/StorageAdapter';
import { DEFAULT_PROFILE } from '../../shared/constants/defaults';

export class ProfileManager {
  private static cache: Map<string, Profile> = new Map();

  /**
   * Generate a unique profile ID
   */
  private static generateId(): string {
    return `profile_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get all profiles
   */
  static async getAll(): Promise<Profile[]> {
    // FIX: Removed <Profile[]> generic. StorageAdapter infers return type from the key 'profiles'
    const profiles = await StorageAdapter.get('profiles');

    if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
      // Create default profile if none exist
      console.log('[TW ProfileManager] No profiles found, creating default.');
      const defaultProfile = await this.createDefaultProfile();
      return [defaultProfile];
    }

    // Update cache with fresh data
    profiles.forEach((profile) => {
      this.cache.set(profile.id, profile);
    });

    return profiles;
  }

  /**
   * Get a specific profile by ID
   */
  static async get(profileId: string): Promise<Profile | null> {
    // Check cache first for speed
    if (this.cache.has(profileId)) {
      return this.cache.get(profileId)!;
    }

    // Load from storage if not in cache
    const profiles = await this.getAll();
    return profiles.find((p) => p.id === profileId) || null;
  }

  /**
   * Get the active profile
   */
  static async getActive(): Promise<Profile> {
    // FIX: Removed <string> generic.
    const activeProfileId = await StorageAdapter.get('activeProfileId');

    if (activeProfileId && typeof activeProfileId === 'string') {
      const profile = await this.get(activeProfileId);
      if (profile) return profile;
    }

    // No active profile found (or ID is stale), find default
    const profiles = await this.getAll();
    const defaultProfile = profiles.find((p) => p.isDefault);

    if (defaultProfile) {
      await this.setActive(defaultProfile.id);
      return defaultProfile;
    }

    // No default profile exists (rare), create one
    return await this.createDefaultProfile();
  }

  /**
   * Set the active profile
   */
  static async setActive(profileId: string): Promise<boolean> {
    const profile = await this.get(profileId);
    if (!profile) {
      console.warn(`[TW ProfileManager] Cannot set active profile: ID ${profileId} not found.`);
      return false;
    }

    return await StorageAdapter.set('activeProfileId', profileId);
  }

  /**
   * Create a new profile
   */
  static async create(input: ProfileCreateInput): Promise<Profile> {
    // FIX: Removed explicit generic, rely on inference and fallback
    const rawProfiles = await StorageAdapter.get('profiles');
    const existingProfiles: Profile[] = Array.isArray(rawProfiles) ? rawProfiles : [];

    // If copying from another profile
    let baseSettings = { ...DEFAULT_PROFILE };
    if (input.copyFrom) {
      const sourceProfile = await this.get(input.copyFrom);
      if (sourceProfile) {
        // Copy strictly relevant fields to avoid carrying over metadata
        baseSettings = {
          name: input.name,
          isDefault: input.isDefault ?? false,
          enabledCategories: [...sourceProfile.enabledCategories],
          categoryActions: { ...sourceProfile.categoryActions },
          display: { ...sourceProfile.display },
          leadTime: sourceProfile.leadTime,
          soundEnabled: sourceProfile.soundEnabled,
          autoHideTime: sourceProfile.autoHideTime,
          theme: sourceProfile.theme,
          defaultProtection: sourceProfile.defaultProtection,
          categoryProtections: { ...sourceProfile.categoryProtections },
          helperMode: sourceProfile.helperMode,
        } as any;
      }
    }

    const now = new Date().toISOString();
    const newProfile: Profile = {
      ...baseSettings,
      id: this.generateId(),
      name: input.name,
      isDefault: input.isDefault ?? false,
      createdAt: now as any,
      updatedAt: now as any,
    };

    // If this new one is default, unset other defaults
    if (newProfile.isDefault) {
      existingProfiles.forEach((p) => {
        p.isDefault = false;
      });
    }

    existingProfiles.push(newProfile);
    await StorageAdapter.set('profiles', existingProfiles);

    // Update cache
    this.cache.set(newProfile.id, newProfile);

    // Set as active if it's the very first profile
    if (existingProfiles.length === 1) {
      await this.setActive(newProfile.id);
    }

    return newProfile;
  }

  /**
   * Update a profile
   */
  static async update(profileId: string, updates: ProfileUpdateInput): Promise<Profile | null> {
    const profiles = await this.getAll();
    const index = profiles.findIndex((p) => p.id === profileId);

    if (index === -1) return null;
    const profile = profiles[index];

    // Apply updates specifically to avoid accidental object replacements
    if (updates.name !== undefined) profile.name = updates.name;
    if (updates.enabledCategories !== undefined)
      profile.enabledCategories = updates.enabledCategories;
    if (updates.categoryActions !== undefined) {
      profile.categoryActions = { ...profile.categoryActions, ...updates.categoryActions };
    }
    if (updates.display !== undefined) {
      profile.display = { ...profile.display, ...updates.display };
    }
    if (updates.leadTime !== undefined) profile.leadTime = updates.leadTime;
    if (updates.soundEnabled !== undefined) profile.soundEnabled = updates.soundEnabled;
    if (updates.autoHideTime !== undefined) profile.autoHideTime = updates.autoHideTime;
    if (updates.theme !== undefined) profile.theme = updates.theme;
    if (updates.defaultProtection !== undefined)
      profile.defaultProtection = updates.defaultProtection;
    if (updates.categoryProtections !== undefined) {
      profile.categoryProtections = {
        ...profile.categoryProtections,
        ...updates.categoryProtections,
      };
    }

    profile.updatedAt = new Date().toISOString() as any;

    // Update the list
    profiles[index] = profile;
    await StorageAdapter.set('profiles', profiles);

    // Update cache
    this.cache.set(profile.id, profile);

    return profile;
  }

  /**
   * Delete a profile
   */
  static async delete(profileId: string): Promise<boolean> {
    const profiles = await this.getAll();
    const index = profiles.findIndex((p) => p.id === profileId);

    if (index === -1) return false;

    // Can't delete the last profile
    if (profiles.length <= 1) {
      console.warn('[TW ProfileManager] Cannot delete the last profile');
      return false;
    }

    // Remove
    profiles.splice(index, 1);

    // If we deleted the default profile, make the first one default
    const wasDefault = this.cache.get(profileId)?.isDefault;
    if (wasDefault && profiles.length > 0) {
      profiles[0].isDefault = true;
    }

    await StorageAdapter.set('profiles', profiles);

    // Remove from cache
    this.cache.delete(profileId);

    // If this was the active profile, set another as active
    const activeProfileId = await StorageAdapter.get('activeProfileId');
    if (activeProfileId === profileId) {
      await this.setActive(profiles[0].id);
    }

    return true;
  }

  /**
   * Initialize: ensuring at least one profile exists.
   */
  static async initialize(): Promise<void> {
    try {
      await this.getActive();
    } catch (e) {
      console.error('[TW ProfileManager] Initialization error', e);
      await this.createDefaultProfile();
    }
  }

  /**
   * Create the default profile
   */
  private static async createDefaultProfile(): Promise<Profile> {
    console.log('[TW ProfileManager] Creating Default Profile');

    const now = new Date().toISOString();
    const defaultProfile: Profile = {
      ...DEFAULT_PROFILE,
      id: this.generateId(),
      name: 'Default Profile',
      isDefault: true,
      createdAt: now as any,
      updatedAt: now as any,
    };

    await StorageAdapter.set('profiles', [defaultProfile]);
    await StorageAdapter.set('activeProfileId', defaultProfile.id);

    this.cache.set(defaultProfile.id, defaultProfile);
    return defaultProfile;
  }

  /**
   * Export a profile to JSON
   */
  static async export(profileId: string): Promise<string | null> {
    const profile = await this.get(profileId);
    if (!profile) return null;

    return JSON.stringify(profile, null, 2);
  }

  /**
   * Import a profile from JSON
   */
  static async import(json: string): Promise<Profile | null> {
    try {
      const data = JSON.parse(json);

      if (!data.name || !data.enabledCategories) {
        console.error('[TW ProfileManager] Invalid profile data for import');
        return null;
      }

      const profile = await this.create({
        name: `${data.name} (Imported)`,
      });

      await this.update(profile.id, {
        enabledCategories: data.enabledCategories,
        categoryActions: data.categoryActions,
        display: data.display,
        leadTime: data.leadTime,
        soundEnabled: data.soundEnabled,
        autoHideTime: data.autoHideTime,
        theme: data.theme,
        defaultProtection: data.defaultProtection,
        categoryProtections: data.categoryProtections,
      });

      return await this.get(profile.id);
    } catch (error) {
      console.error('[TW ProfileManager] Error importing profile:', error);
      return null;
    }
  }
}
