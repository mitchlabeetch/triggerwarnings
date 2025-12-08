/**
 * MediaDatabase - API layer for media content and trigger data
 * Provides methods to lookup media and fetch trigger data from Supabase
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@shared/constants/defaults';
import type {
  MediaContent,
  OverallTrigger,
  TimestampTrigger,
  MediaTriggerData,
  MediaDataState,
  MediaOverallTriggers,
  StreamingPlatform,
  TriggerDataResult,
  MediaLookupResult,
} from '@shared/types/Database.types';
import type { TriggerCategory } from '@shared/types/Warning.types';
import { createLogger } from '@shared/utils/logger';

const logger = createLogger('MediaDatabase');

/**
 * MediaDatabase provides methods to:
 * 1. Look up media by platform-specific ID
 * 2. Fetch overall triggers (severity-based)
 * 3. Fetch timestamp triggers (precise timing)
 * 4. Get combined trigger data for pre-watch screen
 */
export class MediaDatabase {
  private static client: SupabaseClient | null = null;

  /**
   * Get or create Supabase client
   */
  private static getClient(): SupabaseClient {
    if (!this.client) {
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Missing Supabase credentials');
      }
      this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return this.client;
  }

  // ============================================================================
  // Media Lookup
  // ============================================================================

  /**
   * Look up media content by platform-specific ID
   */
  static async lookupByPlatformId(
    platform: StreamingPlatform,
    platformId: string
  ): Promise<MediaLookupResult> {
    try {
      const client = this.getClient();
      const columnName = `${platform}_id`;

      const { data, error } = await client
        .from('media_content')
        .select('*')
        .eq(columnName, platformId)
        .single();

      if (error || !data) {
        logger.debug(`Media not found for ${platform}:${platformId}`);
        return { found: false, media: null };
      }

      return { found: true, media: data as MediaContent };
    } catch (error) {
      logger.error('Error looking up media:', error);
      return { found: false, media: null };
    }
  }

  /**
   * Look up media by IMDB ID
   */
  static async lookupByImdbId(imdbId: string): Promise<MediaLookupResult> {
    try {
      const client = this.getClient();

      const { data, error } = await client
        .from('media_content')
        .select('*')
        .eq('imdb_id', imdbId)
        .single();

      if (error || !data) {
        return { found: false, media: null };
      }

      return { found: true, media: data as MediaContent };
    } catch (error) {
      logger.error('Error looking up media by IMDB:', error);
      return { found: false, media: null };
    }
  }

  // ============================================================================
  // Overall Triggers
  // ============================================================================

  /**
   * Fetch overall triggers for a media
   */
  static async getOverallTriggers(mediaId: string): Promise<MediaOverallTriggers> {
    try {
      const client = this.getClient();

      const { data, error } = await client
        .from('overall_triggers')
        .select('category_key, severity')
        .eq('media_id', mediaId);

      if (error) {
        logger.error('Error fetching overall triggers:', error);
        return {};
      }

      // Convert array to record
      const triggers: MediaOverallTriggers = {};
      for (const row of data || []) {
        const key = row.category_key as TriggerCategory;
        triggers[key] = row.severity;
      }

      return triggers;
    } catch (error) {
      logger.error('Error in getOverallTriggers:', error);
      return {};
    }
  }

  // ============================================================================
  // Timestamp Triggers
  // ============================================================================

  /**
   * Fetch timestamp triggers for a media (approved only)
   */
  static async getTimestampTriggers(mediaId: string): Promise<TimestampTrigger[]> {
    try {
      const client = this.getClient();

      const { data, error } = await client
        .from('timestamp_triggers')
        .select('*')
        .eq('media_id', mediaId)
        .eq('status', 'approved')
        .order('start_time', { ascending: true });

      if (error) {
        logger.error('Error fetching timestamp triggers:', error);
        return [];
      }

      return (data || []) as TimestampTrigger[];
    } catch (error) {
      logger.error('Error in getTimestampTriggers:', error);
      return [];
    }
  }

  /**
   * Count timestamp triggers by category for a media
   */
  static countTimestampsByCategory(
    triggers: TimestampTrigger[]
  ): Partial<Record<TriggerCategory, number>> {
    const counts: Partial<Record<TriggerCategory, number>> = {};

    for (const trigger of triggers) {
      const key = trigger.category_key;
      counts[key] = (counts[key] || 0) + 1;
    }

    return counts;
  }

  // ============================================================================
  // Combined Data for Pre-Watch Screen
  // ============================================================================

  /**
   * Get all trigger data for a media - used by pre-watch screen
   * Determines the data state and returns appropriate data
   */
  static async getTriggerData(
    platform: StreamingPlatform,
    platformId: string
  ): Promise<TriggerDataResult> {
    try {
      // Step 1: Look up media by platform ID
      const lookup = await this.lookupByPlatformId(platform, platformId);

      // State 1: No data - media not in database
      if (!lookup.found || !lookup.media) {
        logger.info(`No database entry for ${platform}:${platformId}`);
        return {
          success: true,
          data: {
            state: 'no_data',
            media: null,
            overallTriggers: {},
            timestampTriggers: [],
            timestampCounts: {},
          },
        };
      }

      const media = lookup.media;

      // Step 2: Fetch both types of triggers
      const [overallTriggers, timestampTriggers] = await Promise.all([
        this.getOverallTriggers(media.id),
        this.getTimestampTriggers(media.id),
      ]);

      const timestampCounts = this.countTimestampsByCategory(timestampTriggers);

      // Determine data state
      const hasOverallTriggers = Object.keys(overallTriggers).length > 0;
      const hasTimestampTriggers = timestampTriggers.length > 0;

      let state: MediaDataState;

      if (hasTimestampTriggers) {
        // State 4: Has timestamps
        state = 'has_timestamps';
      } else if (hasOverallTriggers) {
        // State 3: Overall triggers only
        state = 'overall_only';
      } else {
        // State 2: In database but no triggers
        state = 'no_triggers';
      }

      logger.info(`Trigger data for ${platform}:${platformId} - State: ${state}`);

      return {
        success: true,
        data: {
          state,
          media,
          overallTriggers,
          timestampTriggers,
          timestampCounts,
        },
      };
    } catch (error) {
      logger.error('Error getting trigger data:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================================
  // Submit New Triggers (for helper mode)
  // ============================================================================

  /**
   * Submit a new timestamp trigger
   */
  static async submitTimestampTrigger(
    mediaId: string,
    categoryKey: TriggerCategory,
    startTime: number,
    endTime: number,
    severity: 1 | 2 | 3,
    userId: string | null,
    description?: string
  ): Promise<boolean> {
    try {
      const client = this.getClient();

      const { error } = await client.from('timestamp_triggers').insert({
        media_id: mediaId,
        category_key: categoryKey,
        start_time: startTime,
        end_time: endTime,
        severity,
        confidence: 75, // Default confidence
        submitted_by: userId,
        status: 'pending',
        description: description || null,
      });

      if (error) {
        logger.error('Error submitting trigger:', error);
        return false;
      }

      logger.info(`Timestamp trigger submitted: ${categoryKey} at ${startTime}-${endTime}s`);
      return true;
    } catch (error) {
      logger.error('Error in submitTimestampTrigger:', error);
      return false;
    }
  }

  /**
   * Create or update media content entry
   */
  static async upsertMediaContent(
    platform: StreamingPlatform,
    platformId: string,
    name: string,
    type: 'movie' | 'episode',
    year?: number
  ): Promise<MediaContent | null> {
    try {
      const client = this.getClient();
      const columnName = `${platform}_id`;

      // Check if exists
      const lookup = await this.lookupByPlatformId(platform, platformId);

      if (lookup.found && lookup.media) {
        // Update existing
        const { data, error } = await client
          .from('media_content')
          .update({
            name,
            type,
            year: year || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', lookup.media.id)
          .select()
          .single();

        if (error) {
          logger.error('Error updating media:', error);
          return null;
        }
        return data as MediaContent;
      }

      // Insert new
      const insertData: Record<string, unknown> = {
        name,
        type,
        year: year || null,
        review_status: 'unreviewed',
        [columnName]: platformId,
      };

      const { data, error } = await client
        .from('media_content')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        logger.error('Error creating media:', error);
        return null;
      }

      return data as MediaContent;
    } catch (error) {
      logger.error('Error in upsertMediaContent:', error);
      return null;
    }
  }
}
