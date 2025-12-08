/**
 * Database types for the Supabase-driven warning system
 * Supports both overall triggers (severity flags) and timestamp triggers
 */

import type { TriggerCategory } from './Warning.types';

// ============================================================================
// Media Content Types
// ============================================================================

/**
 * Supported streaming platforms
 */
export type StreamingPlatform =
  | 'netflix'
  | 'amazon'
  | 'disney'
  | 'hulu'
  | 'max'
  | 'peacock'
  | 'youtube';

/**
 * Media content type
 */
export type MediaType = 'movie' | 'episode';

/**
 * Review status for media content
 */
export type ReviewStatus =
  | 'unreviewed' // No data yet
  | 'partial' // Some data, not fully reviewed
  | 'verified'; // Fully reviewed by community/moderators

/**
 * Media content record from the database
 */
export interface MediaContent {
  id: string; // UUID primary key
  name: string; // Title of the media
  year: number | null; // Release year
  type: MediaType; // Movie or episode
  imdb_id: string | null; // IMDB identifier for reconciliation

  // Platform-specific IDs (null if not available on platform)
  netflix_id: string | null;
  amazon_id: string | null;
  disney_id: string | null;
  hulu_id: string | null;
  max_id: string | null;
  peacock_id: string | null;
  youtube_id: string | null;

  // Review status
  review_status: ReviewStatus;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Overall Triggers (Severity-based, no timestamps)
// ============================================================================

/**
 * Severity level for overall triggers
 * 0 = No trigger present
 * 1 = Mild/Infrequent
 * 2 = Moderate/Several instances
 * 3 = Severe/Major theme
 */
export type TriggerSeverity = 0 | 1 | 2 | 3;

/**
 * Overall trigger record - one per media+category combination
 */
export interface OverallTrigger {
  id: string; // UUID primary key
  media_id: string; // FK to media_content.id
  category_key: TriggerCategory;
  severity: TriggerSeverity;
  updated_at: string;
}

/**
 * Overall triggers for a media, grouped by category
 */
export type MediaOverallTriggers = {
  [K in TriggerCategory]?: TriggerSeverity;
};

// ============================================================================
// Timestamp Triggers (Precise timing)
// ============================================================================

/**
 * Status of a timestamp trigger submission
 */
export type TriggerStatus = 'pending' | 'approved' | 'rejected';

/**
 * Timestamp trigger record - precise start/end times
 */
export interface TimestampTrigger {
  id: string; // UUID primary key
  media_id: string; // FK to media_content.id
  category_key: TriggerCategory;
  start_time: number; // Seconds from media start
  end_time: number; // Seconds from media start
  severity: 1 | 2 | 3; // Severity (1-3, no 0 for timestamps)
  confidence: number; // User-reported confidence (0-100)
  submitted_by: string | null; // User ID who submitted
  status: TriggerStatus;
  description: string | null; // Optional description
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Combined Data State for Pre-Watch Screen
// ============================================================================

/**
 * Data availability state for a media
 */
export type MediaDataState =
  | 'no_data' // State 1: Not in database
  | 'no_triggers' // State 2: In database, no triggers found
  | 'overall_only' // State 3: Overall triggers but no timestamps
  | 'has_timestamps'; // State 4: Has timestamp triggers

/**
 * Combined trigger data for pre-watch screen
 */
export interface MediaTriggerData {
  state: MediaDataState;
  media: MediaContent | null;
  overallTriggers: MediaOverallTriggers;
  timestampTriggers: TimestampTrigger[];

  // Derived counts per category (for display)
  timestampCounts: Partial<Record<TriggerCategory, number>>;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Response from looking up media by platform ID
 */
export interface MediaLookupResult {
  found: boolean;
  media: MediaContent | null;
}

/**
 * Response from fetching all trigger data for a media
 */
export interface TriggerDataResult {
  success: boolean;
  data: MediaTriggerData | null;
  error?: string;
}
