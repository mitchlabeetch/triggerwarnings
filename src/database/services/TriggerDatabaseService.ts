/**
 * TRIGGER DATABASE SERVICE
 *
 * Service for querying and managing trigger data from Supabase.
 * Provides methods to fetch media content, overall triggers, and timestamp triggers
 * based on platform-specific video IDs.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  MediaContent,
  OverallTriggers,
  TimestampEntry,
  MediaTriggerData,
  TimestampSubmission,
  PreWatchCase,
  TriggerSeverity,
} from '@shared/types/MediaContent.types';
import type { TriggerCategory, StreamingPlatform } from '@shared/types/Warning.types';
import { PLATFORM_ID_FIELDS, getSeverityKey } from '@shared/types/MediaContent.types';
import { CATEGORY_KEYS } from '@shared/constants/categories';
import { createLogger } from '@shared/utils/logger';

const logger = createLogger('TriggerDatabaseService');

/**
 * Configuration for the database service
 */
interface DatabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

/**
 * Cache entry for media trigger data
 */
interface CacheEntry {
  data: MediaTriggerData;
  timestamp: number;
  expiresAt: number;
}

/**
 * TriggerDatabaseService
 * Handles all database operations for the trigger warning system
 */
export class TriggerDatabaseService {
  private supabase: SupabaseClient | null = null;
  private config: DatabaseConfig | null = null;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Initialize the database service with Supabase credentials
   */
  async initialize(config?: DatabaseConfig): Promise<void> {
    try {
      // Try to get config from environment or storage
      if (config) {
        this.config = config;
      } else {
        // Attempt to load from extension storage or environment
        this.config = await this.loadConfig();
      }

      if (!this.config?.supabaseUrl || !this.config?.supabaseAnonKey) {
        logger.warn('Supabase configuration not available - running in offline mode');
        return;
      }

      this.supabase = createClient(this.config.supabaseUrl, this.config.supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      logger.info('TriggerDatabaseService initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize TriggerDatabaseService:', error);
    }
  }

  /**
   * Load configuration from extension storage
   */
  private async loadConfig(): Promise<DatabaseConfig | null> {
    try {
      // Try to import browser API if available
      const browser = await import('webextension-polyfill')
        .then((m) => m.default)
        .catch(() => null);

      if (browser?.storage) {
        const result = await browser.storage.local.get(['supabaseUrl', 'supabaseAnonKey']);
        if (result.supabaseUrl && result.supabaseAnonKey) {
          return {
            supabaseUrl: result.supabaseUrl,
            supabaseAnonKey: result.supabaseAnonKey,
          };
        }
      }

      // Fallback to Vite environment variables (for development)
      // Using import.meta.env which is available in Vite bundled code
      if (import.meta.env?.VITE_SUPABASE_URL && import.meta.env?.VITE_SUPABASE_ANON_KEY) {
        return {
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
          supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        };
      }

      return null;
    } catch (error) {
      logger.error('Failed to load config:', error);
      return null;
    }
  }

  /**
   * Check if the service is initialized and ready
   */
  isInitialized(): boolean {
    return this.supabase !== null;
  }

  /**
   * Generate cache key for a platform + video ID combination
   */
  private getCacheKey(platform: StreamingPlatform, platformVideoId: string): string {
    return `${platform}:${platformVideoId}`;
  }

  /**
   * Get cached data if available and not expired
   */
  private getCachedData(
    platform: StreamingPlatform,
    platformVideoId: string
  ): MediaTriggerData | null {
    const cacheKey = this.getCacheKey(platform, platformVideoId);
    const entry = this.cache.get(cacheKey);

    if (entry && Date.now() < entry.expiresAt) {
      logger.debug('Cache hit for:', cacheKey);
      return entry.data;
    }

    if (entry) {
      this.cache.delete(cacheKey);
    }

    return null;
  }

  /**
   * Cache trigger data
   */
  private setCachedData(
    platform: StreamingPlatform,
    platformVideoId: string,
    data: MediaTriggerData
  ): void {
    const cacheKey = this.getCacheKey(platform, platformVideoId);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_DURATION_MS,
    });
  }

  /**
   * Clear cache for a specific entry or all entries
   */
  clearCache(platform?: StreamingPlatform, platformVideoId?: string): void {
    if (platform && platformVideoId) {
      this.cache.delete(this.getCacheKey(platform, platformVideoId));
    } else {
      this.cache.clear();
    }
  }

  /**
   * Fetch media content by platform-specific ID
   */
  async getMediaByPlatformId(
    platform: StreamingPlatform,
    platformVideoId: string
  ): Promise<MediaContent | null> {
    if (!this.supabase) {
      logger.warn('Database not initialized');
      return null;
    }

    const idField = PLATFORM_ID_FIELDS[platform];
    if (!idField) {
      logger.error('Unknown platform:', platform);
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from('media_content')
        .select('*')
        .eq(idField, platformVideoId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - content not in database
          return null;
        }
        throw error;
      }

      return this.transformMediaContent(data);
    } catch (error) {
      logger.error('Error fetching media by platform ID:', error);
      return null;
    }
  }

  /**
   * Fetch overall triggers for a media ID
   */
  async getOverallTriggers(mediaId: string): Promise<OverallTriggers | null> {
    if (!this.supabase) {
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from('overall_triggers')
        .select('*')
        .eq('media_id', mediaId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return this.transformOverallTriggers(data);
    } catch (error) {
      logger.error('Error fetching overall triggers:', error);
      return null;
    }
  }

  /**
   * Fetch timestamp triggers for a media ID
   * Optionally filter by specific categories
   */
  async getTimestampTriggers(
    mediaId: string,
    categories?: TriggerCategory[]
  ): Promise<TimestampEntry[]> {
    if (!this.supabase) {
      return [];
    }

    try {
      let query = this.supabase
        .from('timestamp_triggers')
        .select('*')
        .eq('media_id', mediaId)
        .order('start_time', { ascending: true });

      if (categories && categories.length > 0) {
        query = query.in('category', categories);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []).map(this.transformTimestampEntry);
    } catch (error) {
      logger.error('Error fetching timestamp triggers:', error);
      return [];
    }
  }

  /**
   * Get complete trigger data for a piece of media
   * This is the main method used by the warning system
   */
  async getTriggerData(
    platform: StreamingPlatform,
    platformVideoId: string,
    userCategories?: TriggerCategory[]
  ): Promise<MediaTriggerData> {
    // Check cache first
    const cached = this.getCachedData(platform, platformVideoId);
    if (cached) {
      return cached;
    }

    // Create empty response for offline/error cases
    const emptyResponse: MediaTriggerData = {
      media: null,
      overallTriggers: null,
      timestampTriggers: [],
      hasAnyData: false,
      hasOverallTriggers: false,
      hasTimestamps: false,
      triggeredCategories: [],
      totalTimestampCount: 0,
      timestampCountByCategory: {},
    };

    if (!this.supabase) {
      logger.warn('Database not initialized - returning empty data');
      return emptyResponse;
    }

    try {
      // Fetch media content
      const media = await this.getMediaByPlatformId(platform, platformVideoId);

      if (!media) {
        // Content not in database
        this.setCachedData(platform, platformVideoId, emptyResponse);
        return emptyResponse;
      }

      // Fetch overall triggers
      const overallTriggers = await this.getOverallTriggers(media.internal_id);

      // Fetch timestamp triggers (filtered by user preferences if provided)
      const timestampTriggers = await this.getTimestampTriggers(media.internal_id, userCategories);

      // Compute helper data
      const triggeredCategories = overallTriggers
        ? this.extractTriggeredCategories(overallTriggers)
        : [];

      const timestampCountByCategory = this.countTimestampsByCategory(timestampTriggers);

      const result: MediaTriggerData = {
        media,
        overallTriggers,
        timestampTriggers,
        hasAnyData: true,
        hasOverallTriggers: triggeredCategories.length > 0,
        hasTimestamps: timestampTriggers.length > 0,
        triggeredCategories,
        totalTimestampCount: timestampTriggers.length,
        timestampCountByCategory,
      };

      // Cache the result
      this.setCachedData(platform, platformVideoId, result);

      return result;
    } catch (error) {
      logger.error('Error fetching trigger data:', error);
      return emptyResponse;
    }
  }

  /**
   * Determine the pre-watch screen case based on trigger data
   */
  getPreWatchCase(triggerData: MediaTriggerData, userCategories?: TriggerCategory[]): PreWatchCase {
    if (!triggerData.hasAnyData || !triggerData.media) {
      return 'no-data';
    }

    // Filter triggered categories by user preferences
    const relevantCategories = userCategories
      ? triggerData.triggeredCategories.filter((cat) => userCategories.includes(cat))
      : triggerData.triggeredCategories;

    // Filter timestamps by user preferences
    const relevantTimestamps = userCategories
      ? triggerData.timestampTriggers.filter((ts) => userCategories.includes(ts.category))
      : triggerData.timestampTriggers;

    if (relevantTimestamps.length > 0) {
      return 'timestamps';
    }

    if (relevantCategories.length > 0) {
      return 'overall-only';
    }

    return 'no-triggers';
  }

  /**
   * Submit a new timestamp trigger
   */
  async submitTimestampTrigger(
    submission: TimestampSubmission
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      // First, get the media ID
      const media = await this.getMediaByPlatformId(
        submission.platform,
        submission.platform_video_id
      );

      if (!media) {
        return { success: false, error: 'Media not found in database' };
      }

      // Insert the timestamp trigger
      const { error } = await this.supabase.from('timestamp_triggers').insert({
        media_id: media.internal_id,
        category: submission.category,
        start_time: Math.floor(submission.start_time),
        end_time: Math.floor(submission.end_time),
        description: submission.description,
        is_verified: false,
        vote_score: 0,
        upvotes: 0,
        downvotes: 0,
      });

      if (error) {
        throw error;
      }

      // Clear cache for this media
      this.clearCache(submission.platform, submission.platform_video_id);

      return { success: true };
    } catch (error) {
      logger.error('Error submitting timestamp trigger:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Vote on a timestamp trigger
   */
  async voteOnTimestamp(
    timestampId: string,
    userId: string,
    voteType: 'up' | 'down'
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      // Upsert the vote (will update if exists, insert if not)
      const { error } = await this.supabase.from('timestamp_votes').upsert(
        {
          timestamp_id: timestampId,
          user_id: userId,
          vote_type: voteType,
        },
        {
          onConflict: 'timestamp_id,user_id',
        }
      );

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      logger.error('Error voting on timestamp:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Remove a vote from a timestamp trigger
   */
  async removeVote(
    timestampId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      const { error } = await this.supabase
        .from('timestamp_votes')
        .delete()
        .eq('timestamp_id', timestampId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      logger.error('Error removing vote:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ========== Transform Functions ==========

  /**
   * Transform database row to MediaContent type
   */
  private transformMediaContent(row: Record<string, unknown>): MediaContent {
    return {
      internal_id: row.internal_id as string,
      imdb_id: row.imdb_id as string,
      name: row.name as string,
      year: row.year as number,
      type: row.type as MediaContent['type'],
      season: row.season as number | undefined,
      episode: row.episode as number | undefined,
      series_imdb_id: row.series_imdb_id as string | undefined,
      netflix_id: row.netflix_id as string | null,
      amazon_id: row.amazon_id as string | null,
      disney_id: row.disney_id as string | null,
      hulu_id: row.hulu_id as string | null,
      max_id: row.max_id as string | null,
      peacock_id: row.peacock_id as string | null,
      youtube_id: row.youtube_id as string | null,
      is_fully_reviewed: row.is_fully_reviewed as boolean,
      review_status: row.review_status as MediaContent['review_status'],
      review_count: row.review_count as number,
      created_at: new Date(row.created_at as string),
      updated_at: new Date(row.updated_at as string),
    };
  }

  /**
   * Transform database row to OverallTriggers type
   */
  private transformOverallTriggers(row: Record<string, unknown>): OverallTriggers {
    const result: Partial<OverallTriggers> = {
      media_id: row.media_id as string,
      created_at: new Date(row.created_at as string),
      updated_at: new Date(row.updated_at as string),
    };

    // Map all severity columns
    for (const category of CATEGORY_KEYS) {
      const columnName = `${category}_severity`;
      const severityKey = getSeverityKey(category);
      (result as Record<string, unknown>)[severityKey] = (row[columnName] as TriggerSeverity) || 0;
    }

    return result as OverallTriggers;
  }

  /**
   * Transform database row to TimestampEntry type
   */
  private transformTimestampEntry(row: Record<string, unknown>): TimestampEntry {
    return {
      id: row.id as string,
      media_id: row.media_id as string,
      category: row.category as TriggerCategory,
      start_time: row.start_time as number,
      end_time: row.end_time as number,
      description: row.description as string | undefined,
      submitted_by: row.submitted_by as string | undefined,
      is_verified: row.is_verified as boolean,
      vote_score: row.vote_score as number,
      upvotes: row.upvotes as number,
      downvotes: row.downvotes as number,
      created_at: new Date(row.created_at as string),
      updated_at: new Date(row.updated_at as string),
    };
  }

  /**
   * Extract categories with severity > 0 from overall triggers
   */
  private extractTriggeredCategories(overallTriggers: OverallTriggers): TriggerCategory[] {
    const triggered: TriggerCategory[] = [];

    for (const category of CATEGORY_KEYS) {
      const severityKey = getSeverityKey(category);
      const severity = overallTriggers[severityKey] as TriggerSeverity;
      if (severity && severity > 0) {
        triggered.push(category);
      }
    }

    return triggered;
  }

  /**
   * Count timestamps by category
   */
  private countTimestampsByCategory(
    timestamps: TimestampEntry[]
  ): Partial<Record<TriggerCategory, number>> {
    const counts: Partial<Record<TriggerCategory, number>> = {};

    for (const ts of timestamps) {
      counts[ts.category] = (counts[ts.category] || 0) + 1;
    }

    return counts;
  }

  /**
   * Dispose of the service
   */
  dispose(): void {
    this.cache.clear();
    this.supabase = null;
    this.config = null;
  }
}

// Export singleton instance
export const triggerDatabaseService = new TriggerDatabaseService();
