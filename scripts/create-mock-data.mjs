#!/usr/bin/env node
/**
 * Create mock test data for 8 YouTube videos
 * Covers all combinations of triggers:
 * 1. No overall, no timestamps
 * 2. Overall only (no timestamps)
 * 3. Timestamps only (no overall)
 * 4. Both overall and timestamps
 * 5-8. Various severity combinations
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rzkynplgzcxlaecxlylm.supabase.co';
const SUPABASE_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6a3lucGxnemN4bGFlY3hseWxtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjcyMTY5MCwiZXhwIjoyMDc4Mjk3NjkwfQ.Vt7nZAboEbz6r2bWfGtchGSqY6RxnaeeNF8QC5x_8Co';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 8 real YouTube videos (popular, English, 3-40 minutes)
const MOCK_VIDEOS = [
  {
    // Case 1: No overall triggers, no timestamps (safe content)
    youtube_id: 'dQw4w9WgXcQ', // Rick Astley - Never Gonna Give You Up (3:33)
    name: 'Never Gonna Give You Up',
    imdb_id: 'yt_dQw4w9WgXcQ',
    year: 2009,
    type: 'short',
    hasOverall: false,
    hasTimestamps: false,
    description: 'Music video - completely safe',
  },
  {
    // Case 2: Overall triggers only (no timestamps) - general content warnings
    youtube_id: 'JGwWNGJdvx8', // Ed Sheeran - Shape of You (4:24)
    name: 'Shape of You - Ed Sheeran',
    imdb_id: 'yt_JGwWNGJdvx8',
    year: 2017,
    type: 'short',
    hasOverall: true,
    hasTimestamps: false,
    overallTriggers: {
      sex_severity: 1, // Mild suggestive content
    },
    description: 'Music video with mild suggestive themes',
  },
  {
    // Case 3: Timestamps only (no overall) - specific scene warnings
    youtube_id: 'YQHsXMglC9A', // Adele - Hello (6:07)
    name: 'Hello - Adele',
    imdb_id: 'yt_YQHsXMglC9A',
    year: 2015,
    type: 'short',
    hasOverall: false,
    hasTimestamps: true,
    timestamps: [{ category: 'screams', start: 180, end: 195, description: 'Emotional singing' }],
    description: 'Emotional music video',
  },
  {
    // Case 4: Both overall AND timestamps - action content
    youtube_id: 'n1WpP7iowLc', // Daft Punk - Harder Better Faster Stronger (3:45)
    name: 'Harder Better Faster - Daft Punk',
    imdb_id: 'yt_n1WpP7iowLc',
    year: 2007,
    type: 'short',
    hasOverall: true,
    hasTimestamps: true,
    overallTriggers: {
      flashing_lights_severity: 2, // Moderate flashing
      loud_noises_severity: 1,
    },
    timestamps: [
      { category: 'flashing_lights', start: 45, end: 60, description: 'Strobe effect intro' },
      { category: 'flashing_lights', start: 120, end: 145, description: 'Peak visual effects' },
      { category: 'loud_noises', start: 180, end: 200, description: 'Bass drop' },
    ],
    description: 'Music video with flashing lights',
  },
  {
    // Case 5: Multiple high-severity triggers (movie trailer example)
    youtube_id: 'sGbxmsDFVnE', // The Dark Knight Rises Trailer (2:48)
    name: 'The Dark Knight Rises - Trailer',
    imdb_id: 'yt_sGbxmsDFVnE',
    year: 2012,
    type: 'short',
    hasOverall: true,
    hasTimestamps: true,
    overallTriggers: {
      violence_severity: 2,
      explosions_severity: 3,
      gunshots_severity: 2,
      threats_severity: 2,
    },
    timestamps: [
      { category: 'violence', start: 30, end: 45, description: 'Fight scene preview' },
      { category: 'explosions', start: 90, end: 105, description: 'Building explosion' },
      { category: 'gunshots', start: 120, end: 130, description: 'Shootout scene' },
      { category: 'threats', start: 140, end: 155, description: 'Villain monologue' },
    ],
    description: 'Action movie trailer with violence',
  },
  {
    // Case 6: Emotional/psychological triggers
    youtube_id: 'WNeLUngb-Xg', // Pixar Inside Out - Bing Bong Scene (educational, ~5min)
    name: 'Inside Out - Emotional Scenes Compilation',
    imdb_id: 'yt_WNeLUngb-Xg',
    year: 2015,
    type: 'short',
    hasOverall: true,
    hasTimestamps: true,
    overallTriggers: {
      death_dying_severity: 2,
      children_screaming_severity: 1,
    },
    timestamps: [
      { category: 'death_dying', start: 180, end: 240, description: 'Character sacrifice scene' },
      { category: 'screams', start: 60, end: 75, description: 'Emotional outburst' },
    ],
    description: 'Animated film with emotional themes',
  },
  {
    // Case 7: Documentary-style with various triggers
    youtube_id: 'ZbZSe6N_BXs', // Gangnam Style (4:13) - for testing with comedy
    name: 'Gangnam Style - PSY',
    imdb_id: 'yt_ZbZSe6N_BXs',
    year: 2012,
    type: 'short',
    hasOverall: true,
    hasTimestamps: false,
    overallTriggers: {
      loud_noises_severity: 1,
      flashing_lights_severity: 1,
    },
    description: 'Viral music video',
  },
  {
    // Case 8: Nature/medical content
    youtube_id: 'SqcY0GlETPk', // Tom Scott - something educational (~10min)
    name: 'Tom Scott - The Artificial Gravity Lab',
    imdb_id: 'yt_SqcY0GlETPk',
    year: 2019,
    type: 'short',
    hasOverall: true,
    hasTimestamps: true,
    overallTriggers: {
      medical_procedures_severity: 1,
      claustrophobia_triggers_severity: 2,
    },
    timestamps: [
      {
        category: 'medical_procedures',
        start: 300,
        end: 360,
        description: 'Medical equipment shown',
      },
      {
        category: 'claustrophobia_triggers',
        start: 180,
        end: 240,
        description: 'Enclosed space demo',
      },
      { category: 'vomit', start: 420, end: 435, description: 'Motion sickness mention' },
    ],
    description: 'Educational video about simulation',
  },
];

async function createMockData() {
  console.log('🎬 Creating mock test data for 8 YouTube videos...\n');

  // First, clean up any existing test data
  console.log('🧹 Cleaning up existing mock data...');
  for (const video of MOCK_VIDEOS) {
    const { data: existing } = await supabase
      .from('media_content')
      .select('internal_id')
      .eq('youtube_id', video.youtube_id)
      .single();

    if (existing) {
      await supabase.from('timestamp_triggers').delete().eq('media_id', existing.internal_id);
      await supabase.from('overall_triggers').delete().eq('media_id', existing.internal_id);
      await supabase.from('media_content').delete().eq('internal_id', existing.internal_id);
    }
  }

  // Create mock data
  for (let i = 0; i < MOCK_VIDEOS.length; i++) {
    const video = MOCK_VIDEOS[i];
    console.log(`\n📹 Video ${i + 1}/8: ${video.name}`);
    console.log(`   YouTube ID: ${video.youtube_id}`);
    console.log(
      `   Type: ${video.hasOverall ? 'Overall' : 'No Overall'} + ${video.hasTimestamps ? 'Timestamps' : 'No Timestamps'}`
    );

    // 1. Create media_content entry
    const { data: media, error: mediaErr } = await supabase
      .from('media_content')
      .insert({
        imdb_id: video.imdb_id,
        name: video.name,
        year: video.year,
        type: video.type,
        youtube_id: video.youtube_id,
        is_fully_reviewed: true,
        review_status: 'verified',
      })
      .select()
      .single();

    if (mediaErr) {
      console.log(`   ❌ Error creating media: ${mediaErr.message}`);
      continue;
    }
    console.log(`   ✅ Media created: ${media.internal_id}`);

    // 2. Create overall_triggers if needed
    if (video.hasOverall && video.overallTriggers) {
      const { error: overallErr } = await supabase.from('overall_triggers').insert({
        media_id: media.internal_id,
        ...video.overallTriggers,
      });

      if (overallErr) {
        console.log(`   ❌ Error creating overall triggers: ${overallErr.message}`);
      } else {
        const triggerCount = Object.keys(video.overallTriggers).length;
        console.log(`   ✅ Overall triggers: ${triggerCount} categories`);
      }
    }

    // 3. Create timestamp_triggers if needed
    if (video.hasTimestamps && video.timestamps) {
      for (const ts of video.timestamps) {
        const { error: tsErr } = await supabase.from('timestamp_triggers').insert({
          media_id: media.internal_id,
          category: ts.category,
          start_time: ts.start,
          end_time: ts.end,
          description: ts.description,
          is_verified: true,
        });

        if (tsErr) {
          console.log(`   ❌ Error creating timestamp: ${tsErr.message}`);
        }
      }
      console.log(`   ✅ Timestamps: ${video.timestamps.length} entries`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 MOCK DATA SUMMARY');
  console.log('='.repeat(60));

  const { count: mediaCount } = await supabase
    .from('media_content')
    .select('*', { count: 'exact', head: true });
  const { count: overallCount } = await supabase
    .from('overall_triggers')
    .select('*', { count: 'exact', head: true });
  const { count: tsCount } = await supabase
    .from('timestamp_triggers')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📹 Media entries: ${mediaCount}`);
  console.log(`⚠️  Overall triggers: ${overallCount}`);
  console.log(`⏱️  Timestamp triggers: ${tsCount}`);

  console.log('\n📋 Test cases covered:');
  console.log('   1. ✅ No overall, no timestamps (safe content)');
  console.log('   2. ✅ Overall only (general warnings)');
  console.log('   3. ✅ Timestamps only (specific scenes)');
  console.log('   4. ✅ Both overall and timestamps');
  console.log('   5. ✅ Multiple high-severity triggers');
  console.log('   6. ✅ Emotional/psychological triggers');
  console.log('   7. ✅ Overall only with mild triggers');
  console.log('   8. ✅ Educational content with varied triggers');

  console.log('\n🎉 Mock data creation complete!');
  console.log('\n📌 YouTube IDs for testing:');
  for (const video of MOCK_VIDEOS) {
    console.log(`   https://youtube.com/watch?v=${video.youtube_id}`);
  }
}

createMockData().catch(console.error);
