#!/usr/bin/env node
/**
 * Database Migration Script - Create Core Tables
 *
 * Creates:
 * - media_content
 * - overall_triggers (with 44 severity columns)
 * - timestamp_triggers
 * - timestamp_votes
 * - RLS policies and helper functions
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rzkynplgzcxlaecxlylm.supabase.co';
const SUPABASE_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6a3lucGxnemN4bGFlY3hseWxtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjcyMTY5MCwiZXhwIjoyMDc4Mjk3NjkwfQ.Vt7nZAboEbz6r2bWfGtchGSqY6RxnaeeNF8QC5x_8Co';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// All 44 trigger categories from categories.ts
const CATEGORIES = [
  'violence',
  'blood',
  'gore',
  'sexual_assault',
  'sex',
  'self_harm',
  'suicide',
  'eating_disorders',
  'drugs',
  'swear_words',
  'spiders_snakes',
  'animal_cruelty',
  'child_abuse',
  'children_screaming',
  'domestic_violence',
  'racial_violence',
  'lgbtq_phobia',
  'religious_trauma',
  'dead_body_body_horror',
  'torture',
  'murder',
  'detonations_bombs',
  'medical_procedures',
  'vomit',
  'flashing_lights',
  'jumpscares',
  'natural_disasters',
  'cannibalism',
  'gunshots',
  'explosions',
  'screams',
  'slurs',
  'hate_speech',
  'threats',
  'photosensitivity',
  'loud_noises',
  'insects_spiders',
  'snakes_reptiles',
  'needles_injections',
  'pregnancy_childbirth',
  'death_dying',
  'claustrophobia_triggers',
  'physical_violence',
  'car_crashes',
];

// Generate severity columns for overall_triggers
const severityColumns = CATEGORIES.map(
  (cat) =>
    `  ${cat}_severity INTEGER DEFAULT 0 CHECK (${cat}_severity >= 0 AND ${cat}_severity <= 3)`
).join(',\n');

// Generate category constraint for timestamp_triggers
const categoryList = CATEGORIES.map((c) => `'${c}'`).join(', ');

async function runMigration() {
  console.log('🚀 Starting database migration...\n');

  // Migration 1: Helper function for updated_at
  console.log('📦 Creating helper function...');
  const { error: funcError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `,
  });

  if (funcError) {
    console.log('   ℹ️ Helper function may already exist or RPC not available, trying raw SQL...');
  }

  // Migration 2: media_content table
  console.log('📦 Creating media_content table...');
  const mediaContentSQL = `
    CREATE TABLE IF NOT EXISTS media_content (
      internal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      imdb_id VARCHAR(20) UNIQUE NOT NULL,
      name TEXT NOT NULL,
      year INTEGER NOT NULL CHECK (year >= 1888 AND year <= 2100),
      type VARCHAR(10) NOT NULL CHECK (type IN ('movie', 'episode', 'series', 'short')),
      season INTEGER,
      episode INTEGER,
      series_imdb_id VARCHAR(20),
      netflix_id VARCHAR(50),
      amazon_id VARCHAR(50),
      disney_id VARCHAR(50),
      hulu_id VARCHAR(50),
      max_id VARCHAR(50),
      peacock_id VARCHAR(50),
      youtube_id VARCHAR(100),
      is_fully_reviewed BOOLEAN DEFAULT false,
      review_status VARCHAR(20) DEFAULT 'unreviewed' CHECK (review_status IN ('unreviewed', 'partial', 'community_reviewed', 'verified')),
      review_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT valid_episode_info CHECK (
        (type != 'episode') OR 
        (type = 'episode' AND season IS NOT NULL AND episode IS NOT NULL)
      )
    );
  `;

  // Migration 3: overall_triggers table
  console.log('📦 Creating overall_triggers table...');
  const overallTriggersSQL = `
    CREATE TABLE IF NOT EXISTS overall_triggers (
      media_id UUID PRIMARY KEY REFERENCES media_content(internal_id) ON DELETE CASCADE,
${severityColumns},
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  // Migration 4: timestamp_triggers table
  console.log('📦 Creating timestamp_triggers table...');
  const timestampTriggersSQL = `
    CREATE TABLE IF NOT EXISTS timestamp_triggers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      media_id UUID NOT NULL REFERENCES media_content(internal_id) ON DELETE CASCADE,
      category VARCHAR(50) NOT NULL,
      start_time INTEGER NOT NULL CHECK (start_time >= 0),
      end_time INTEGER NOT NULL CHECK (end_time >= 0),
      description TEXT,
      submitted_by UUID,
      is_verified BOOLEAN DEFAULT false,
      vote_score INTEGER DEFAULT 0,
      upvotes INTEGER DEFAULT 0,
      downvotes INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT valid_time_range CHECK (end_time >= start_time),
      CONSTRAINT valid_category CHECK (category IN (${categoryList}))
    );
  `;

  // Migration 5: timestamp_votes table
  console.log('📦 Creating timestamp_votes table...');
  const timestampVotesSQL = `
    CREATE TABLE IF NOT EXISTS timestamp_votes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      timestamp_id UUID NOT NULL REFERENCES timestamp_triggers(id) ON DELETE CASCADE,
      user_id UUID NOT NULL,
      vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'down')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(timestamp_id, user_id)
    );
  `;

  // Execute all migrations
  const migrations = [
    { name: 'media_content', sql: mediaContentSQL },
    { name: 'overall_triggers', sql: overallTriggersSQL },
    { name: 'timestamp_triggers', sql: timestampTriggersSQL },
    { name: 'timestamp_votes', sql: timestampVotesSQL },
  ];

  for (const migration of migrations) {
    console.log(`\n⏳ Executing: ${migration.name}...`);

    // Try using pg_temp or admin API - this is a workaround since we can't run raw SQL
    // We need to use the Supabase dashboard SQL editor for this
    console.log(`   SQL prepared for: ${migration.name}`);
    console.log(`   Length: ${migration.sql.length} characters`);
  }

  // Print all SQL for manual execution
  console.log('\n' + '='.repeat(80));
  console.log('📋 COMPLETE SQL MIGRATION SCRIPT');
  console.log('='.repeat(80));
  console.log('\nCopy and paste this into the Supabase SQL Editor:\n');

  const fullSQL = `
-- ============================================
-- TRIGGER WARNINGS DATABASE MIGRATION
-- Created: ${new Date().toISOString()}
-- ============================================

-- Helper function for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABLE: media_content
-- ============================================
${mediaContentSQL}

-- Indexes for fast platform lookups
CREATE INDEX IF NOT EXISTS idx_media_netflix ON media_content(netflix_id) WHERE netflix_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_amazon ON media_content(amazon_id) WHERE amazon_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_disney ON media_content(disney_id) WHERE disney_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_hulu ON media_content(hulu_id) WHERE hulu_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_max ON media_content(max_id) WHERE max_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_peacock ON media_content(peacock_id) WHERE peacock_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_youtube ON media_content(youtube_id) WHERE youtube_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_imdb ON media_content(imdb_id);
CREATE INDEX IF NOT EXISTS idx_media_name ON media_content(name);

-- Auto-update trigger
DROP TRIGGER IF EXISTS trigger_media_content_updated_at ON media_content;
CREATE TRIGGER trigger_media_content_updated_at
  BEFORE UPDATE ON media_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: overall_triggers
-- ============================================
${overallTriggersSQL}

CREATE INDEX IF NOT EXISTS idx_overall_triggers_media ON overall_triggers(media_id);

DROP TRIGGER IF EXISTS trigger_overall_triggers_updated_at ON overall_triggers;
CREATE TRIGGER trigger_overall_triggers_updated_at
  BEFORE UPDATE ON overall_triggers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: timestamp_triggers
-- ============================================
${timestampTriggersSQL}

CREATE INDEX IF NOT EXISTS idx_timestamp_triggers_media ON timestamp_triggers(media_id);
CREATE INDEX IF NOT EXISTS idx_timestamp_triggers_category ON timestamp_triggers(category);
CREATE INDEX IF NOT EXISTS idx_timestamp_triggers_time ON timestamp_triggers(media_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_timestamp_triggers_verified ON timestamp_triggers(is_verified) WHERE is_verified = true;

DROP TRIGGER IF EXISTS trigger_timestamp_triggers_updated_at ON timestamp_triggers;
CREATE TRIGGER trigger_timestamp_triggers_updated_at
  BEFORE UPDATE ON timestamp_triggers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: timestamp_votes
-- ============================================
${timestampVotesSQL}

CREATE INDEX IF NOT EXISTS idx_timestamp_votes_timestamp ON timestamp_votes(timestamp_id);
CREATE INDEX IF NOT EXISTS idx_timestamp_votes_user ON timestamp_votes(user_id);

-- ============================================
-- VOTE COUNTING FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_timestamp_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'up' THEN
      UPDATE timestamp_triggers SET upvotes = upvotes + 1, vote_score = vote_score + 1 WHERE id = NEW.timestamp_id;
    ELSE
      UPDATE timestamp_triggers SET downvotes = downvotes + 1, vote_score = vote_score - 1 WHERE id = NEW.timestamp_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'up' THEN
      UPDATE timestamp_triggers SET upvotes = upvotes - 1, vote_score = vote_score - 1 WHERE id = OLD.timestamp_id;
    ELSE
      UPDATE timestamp_triggers SET downvotes = downvotes - 1, vote_score = vote_score + 1 WHERE id = OLD.timestamp_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type != NEW.vote_type THEN
      IF NEW.vote_type = 'up' THEN
        UPDATE timestamp_triggers SET upvotes = upvotes + 1, downvotes = downvotes - 1, vote_score = vote_score + 2 WHERE id = NEW.timestamp_id;
      ELSE
        UPDATE timestamp_triggers SET upvotes = upvotes - 1, downvotes = downvotes + 1, vote_score = vote_score - 2 WHERE id = NEW.timestamp_id;
      END IF;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_timestamp_votes_update ON timestamp_votes;
CREATE TRIGGER trigger_timestamp_votes_update
  AFTER INSERT OR UPDATE OR DELETE ON timestamp_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp_vote_counts();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE media_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE overall_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE timestamp_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE timestamp_votes ENABLE ROW LEVEL SECURITY;

-- Public read access
DROP POLICY IF EXISTS "Public read access for media_content" ON media_content;
CREATE POLICY "Public read access for media_content"
  ON media_content FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public read access for overall_triggers" ON overall_triggers;
CREATE POLICY "Public read access for overall_triggers"
  ON overall_triggers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public read access for timestamp_triggers" ON timestamp_triggers;
CREATE POLICY "Public read access for timestamp_triggers"
  ON timestamp_triggers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public read access for timestamp_votes" ON timestamp_votes;
CREATE POLICY "Public read access for timestamp_votes"
  ON timestamp_votes FOR SELECT
  USING (true);

-- Authenticated users can submit timestamps
DROP POLICY IF EXISTS "Authenticated users can submit timestamps" ON timestamp_triggers;
CREATE POLICY "Authenticated users can submit timestamps"
  ON timestamp_triggers FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can manage their own votes
DROP POLICY IF EXISTS "Users can insert their own votes" ON timestamp_votes;
CREATE POLICY "Users can insert their own votes"
  ON timestamp_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own votes" ON timestamp_votes;
CREATE POLICY "Users can update their own votes"
  ON timestamp_votes FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own votes" ON timestamp_votes;
CREATE POLICY "Users can delete their own votes"
  ON timestamp_votes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
SELECT 'Migration completed successfully!' as status;
`;

  console.log(fullSQL);

  // Save to file
  const fs = await import('fs');
  fs.writeFileSync('./scripts/migration.sql', fullSQL);
  console.log('\n✅ SQL saved to: scripts/migration.sql');
  console.log('\n📋 Next steps:');
  console.log('   1. Go to Supabase Dashboard > SQL Editor');
  console.log('   2. Paste the SQL above or open scripts/migration.sql');
  console.log('   3. Click "Run" to execute');
  console.log('   4. Run: node scripts/verify-db-schema.mjs');
}

runMigration();
