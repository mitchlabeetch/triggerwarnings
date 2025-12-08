/**
 * Media Content Types for Database-Driven Warning System
 *
 * This file defines the TypeScript types for media content entries
 * with platform-specific IDs and trigger severity/timestamp data.
 */

import type { TriggerCategory, StreamingPlatform } from './Warning.types';

/**
 * Severity levels for overall triggers
 * 0 = No trigger signaled
 * 1 = Mild - Minor presence, may not affect most viewers
 * 2 = Moderate - Notable presence, sensitive viewers should be aware
 * 3 = Severe - Strongly unadvised for sensitive viewers
 */
export type TriggerSeverity = 0 | 1 | 2 | 3;

/**
 * Media content type
 */
export type MediaType = 'movie' | 'episode' | 'series' | 'short';

/**
 * Review status for media content
 */
export type ReviewStatus = 'unreviewed' | 'partial' | 'community_reviewed' | 'verified';

/**
 * Base media content entry
 * Contains common fields for all media in the database
 */
export interface MediaContent {
  /** Internal database UUID */
  internal_id: string;

  /** IMDB ID for cross-platform reconciliation (e.g., "tt1234567") */
  imdb_id: string;

  /** Title of the movie/episode */
  name: string;

  /** Release year */
  year: number;

  /** Type of content */
  type: MediaType;

  /** Season number (for episodes) */
  season?: number;

  /** Episode number (for episodes) */
  episode?: number;

  /** Parent series IMDB ID (for episodes) */
  series_imdb_id?: string;

  // Platform-specific IDs (null if not available on platform)
  /** Netflix video ID (numeric string from /watch/XXXXX) */
  netflix_id: string | null;

  /** Amazon Prime Video ASIN */
  amazon_id: string | null;

  /** Disney+ content ID */
  disney_id: string | null;

  /** Hulu content ID */
  hulu_id: string | null;

  /** HBO Max / Max content ID */
  max_id: string | null;

  /** Peacock content ID */
  peacock_id: string | null;

  /** YouTube video ID */
  youtube_id: string | null;

  // Review metadata
  /** Whether content has been fully reviewed for all triggers */
  is_fully_reviewed: boolean;

  /** Current review status */
  review_status: ReviewStatus;

  /** Number of community reviews/contributions */
  review_count: number;

  /** Timestamps */
  created_at: Date;
  updated_at: Date;
}

/**
 * Overall trigger severities for a piece of media
 * Each category has a severity from 0-3
 */
export interface OverallTriggers {
  /** Reference to media content */
  media_id: string;

  // Severity for each trigger category (0-3)
  violence_severity: TriggerSeverity;
  blood_severity: TriggerSeverity;
  gore_severity: TriggerSeverity;
  sexual_assault_severity: TriggerSeverity;
  sex_severity: TriggerSeverity;
  self_harm_severity: TriggerSeverity;
  suicide_severity: TriggerSeverity;
  eating_disorders_severity: TriggerSeverity;
  drugs_severity: TriggerSeverity;
  swear_words_severity: TriggerSeverity;
  spiders_snakes_severity: TriggerSeverity;
  animal_cruelty_severity: TriggerSeverity;
  child_abuse_severity: TriggerSeverity;
  children_screaming_severity: TriggerSeverity;
  domestic_violence_severity: TriggerSeverity;
  racial_violence_severity: TriggerSeverity;
  lgbtq_phobia_severity: TriggerSeverity;
  religious_trauma_severity: TriggerSeverity;
  dead_body_body_horror_severity: TriggerSeverity;
  torture_severity: TriggerSeverity;
  murder_severity: TriggerSeverity;
  detonations_bombs_severity: TriggerSeverity;
  medical_procedures_severity: TriggerSeverity;
  vomit_severity: TriggerSeverity;
  flashing_lights_severity: TriggerSeverity;
  jumpscares_severity: TriggerSeverity;
  natural_disasters_severity: TriggerSeverity;
  cannibalism_severity: TriggerSeverity;
  gunshots_severity: TriggerSeverity;
  explosions_severity: TriggerSeverity;
  screams_severity: TriggerSeverity;
  slurs_severity: TriggerSeverity;
  hate_speech_severity: TriggerSeverity;
  threats_severity: TriggerSeverity;
  photosensitivity_severity: TriggerSeverity;
  loud_noises_severity: TriggerSeverity;
  insects_spiders_severity: TriggerSeverity;
  snakes_reptiles_severity: TriggerSeverity;
  needles_injections_severity: TriggerSeverity;
  pregnancy_childbirth_severity: TriggerSeverity;
  death_dying_severity: TriggerSeverity;
  claustrophobia_triggers_severity: TriggerSeverity;
  physical_violence_severity: TriggerSeverity;
  car_crashes_severity: TriggerSeverity;

  /** Timestamps */
  created_at: Date;
  updated_at: Date;
}

/**
 * A single timestamp entry for a trigger
 * Represents a time range where triggering content appears
 */
export interface TimestampEntry {
  /** Trigger ID */
  id: string;

  /** Reference to media content */
  media_id: string;

  /** Which trigger category */
  category: TriggerCategory;

  /** Start time in seconds from beginning */
  start_time: number;

  /** End time in seconds from beginning */
  end_time: number;

  /** Optional description of the trigger */
  description?: string;

  /** User who submitted this timestamp */
  submitted_by?: string;

  /** Whether this has been verified by moderators/community */
  is_verified: boolean;

  /** Community vote score (positive = accurate, negative = inaccurate) */
  vote_score: number;

  /** Number of upvotes */
  upvotes: number;

  /** Number of downvotes */
  downvotes: number;

  /** Timestamps */
  created_at: Date;
  updated_at: Date;
}

/**
 * Combined trigger data for a piece of media
 * Used by the pre-watch screen and watching overlay
 */
export interface MediaTriggerData {
  /** Media content info */
  media: MediaContent | null;

  /** Overall severity data (null if no overall data exists) */
  overallTriggers: OverallTriggers | null;

  /** Timestamp triggers (empty array if none) */
  timestampTriggers: TimestampEntry[];

  /** Pre-computed helper flags */
  hasAnyData: boolean;
  hasOverallTriggers: boolean;
  hasTimestamps: boolean;

  /** Categories that have severity > 0 */
  triggeredCategories: TriggerCategory[];

  /** Total number of timestamp entries */
  totalTimestampCount: number;

  /** Count of timestamps per category */
  timestampCountByCategory: Partial<Record<TriggerCategory, number>>;
}

/**
 * Data display case for the pre-watch safety screen
 */
export type PreWatchCase =
  | 'no-data' // No entry in database at all
  | 'no-triggers' // Entry exists but no triggers flagged
  | 'overall-only' // Only overall triggers, no timestamps
  | 'timestamps'; // Has timestamp data for protection

/**
 * Submission for adding a new timestamp trigger
 */
export interface TimestampSubmission {
  /** Platform where content is being watched */
  platform: StreamingPlatform;

  /** Platform-specific video ID */
  platform_video_id: string;

  /** Trigger category */
  category: TriggerCategory;

  /** Start time in seconds */
  start_time: number;

  /** End time in seconds */
  end_time: number;

  /** Optional description */
  description?: string;

  /** User's confidence level (0-100) */
  confidence?: number;
}

/**
 * Watching status for the overlay
 */
export type WatchingStatus =
  | 'protected' // Has timestamp data, actively monitoring
  | 'overall-only' // Only overall triggers available
  | 'unprotected' // No trigger data available
  | 'reviewing'; // User is in helper/review mode

/**
 * Helper function to get severity key for a category
 */
export function getSeverityKey(category: TriggerCategory): keyof OverallTriggers {
  return `${category}_severity` as keyof OverallTriggers;
}

/**
 * Helper function to format time in HH:MM:SS
 */
export function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Helper function to parse HH:MM:SS to seconds
 */
export function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] || 0;
}

/**
 * Platform ID field mapping
 */
export const PLATFORM_ID_FIELDS: Record<StreamingPlatform, keyof MediaContent> = {
  netflix: 'netflix_id',
  prime_video: 'amazon_id',
  disney_plus: 'disney_id',
  hulu: 'hulu_id',
  max: 'max_id',
  peacock: 'peacock_id',
  youtube: 'youtube_id',
};
