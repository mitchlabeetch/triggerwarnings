/**
 * ProfileManager Unit Tests
 *
 * Tests for profile CRUD operations, default profile creation, and profile switching
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProfileManager } from './ProfileManager';
import { StorageAdapter } from '../storage/StorageAdapter';
import type { Profile } from '@shared/types/Profile.types';

// Mock the StorageAdapter
vi.mock('../storage/StorageAdapter', () => ({
  StorageAdapter: {
    get: vi.fn(),
    set: vi.fn().mockResolvedValue(true),
    remove: vi.fn().mockResolvedValue(true),
  },
}));

// Mock the logger
vi.mock('@shared/utils/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('ProfileManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the static cache
    (ProfileManager as any).cache.clear();
  });

  describe('getAll', () => {
    it('should return existing profiles from storage', async () => {
      const mockProfiles: Profile[] = [
        {
          id: 'profile_1',
          name: 'Test Profile',
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          enabledCategories: ['violence', 'blood'],
          categoryActions: {},
          display: {
            position: 'top-center',
            fontSize: 14,
            backgroundColor: '#000',
            transparency: 80,
            duration: 5,
            spoilerFreeMode: false,
          },
          leadTime: 10,
          soundEnabled: true,
          autoHideTime: 5,
          theme: 'system',
          defaultProtection: 'warn',
          categoryProtections: {},
          helperMode: false,
        },
      ];

      vi.mocked(StorageAdapter.get).mockResolvedValue(mockProfiles);

      const profiles = await ProfileManager.getAll();

      expect(profiles).toHaveLength(1);
      expect(profiles[0].name).toBe('Test Profile');
    });

    it('should create default profile if none exist', async () => {
      vi.mocked(StorageAdapter.get).mockResolvedValue(null);

      const profiles = await ProfileManager.getAll();

      expect(profiles).toHaveLength(1);
      expect(profiles[0].isDefault).toBe(true);
      expect(StorageAdapter.set).toHaveBeenCalled();
    });
  });

  describe('getActive', () => {
    it('should return the active profile', async () => {
      const mockProfile: Profile = {
        id: 'profile_active',
        name: 'Active Profile',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        enabledCategories: [],
        categoryActions: {},
        display: {
          position: 'top-center',
          fontSize: 14,
          backgroundColor: '#000',
          transparency: 80,
          duration: 5,
          spoilerFreeMode: false,
        },
        leadTime: 10,
        soundEnabled: true,
        autoHideTime: 5,
        theme: 'system',
        defaultProtection: 'warn',
        categoryProtections: {},
        helperMode: false,
      };

      vi.mocked(StorageAdapter.get).mockImplementation(async (key: string) => {
        if (key === 'activeProfileId') return 'profile_active';
        if (key === 'profiles') return [mockProfile];
        return null;
      });

      const active = await ProfileManager.getActive();

      expect(active.id).toBe('profile_active');
      expect(active.name).toBe('Active Profile');
    });
  });

  describe('create', () => {
    it('should create a new profile', async () => {
      vi.mocked(StorageAdapter.get).mockResolvedValue([]);

      const newProfile = await ProfileManager.create({
        name: 'New Profile',
        isDefault: false,
      });

      expect(newProfile.name).toBe('New Profile');
      expect(newProfile.id).toMatch(/^profile_/);
      expect(StorageAdapter.set).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should not delete the last profile', async () => {
      const mockProfile: Profile = {
        id: 'profile_1',
        name: 'Only Profile',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        enabledCategories: [],
        categoryActions: {},
        display: {
          position: 'top-center',
          fontSize: 14,
          backgroundColor: '#000',
          transparency: 80,
          duration: 5,
          spoilerFreeMode: false,
        },
        leadTime: 10,
        soundEnabled: true,
        autoHideTime: 5,
        theme: 'system',
        defaultProtection: 'warn',
        categoryProtections: {},
        helperMode: false,
      };

      vi.mocked(StorageAdapter.get).mockResolvedValue([mockProfile]);

      const result = await ProfileManager.delete('profile_1');

      expect(result).toBe(false);
    });
  });
});
