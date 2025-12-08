#!/usr/bin/env node
/**
 * Verify the new database schema is working correctly
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rzkynplgzcxlaecxlylm.supabase.co';
const SUPABASE_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6a3lucGxnemN4bGFlY3hseWxtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjcyMTY5MCwiZXhwIjoyMDc4Mjk3NjkwfQ.Vt7nZAboEbz6r2bWfGtchGSqY6RxnaeeNF8QC5x_8Co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6a3lucGxnemN4bGFlY3hseWxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MjE2OTAsImV4cCI6MjA3ODI5NzY5MH0.24lj8QXRK-FS8uQQRtA4H--laEDosdGBCGXnmmnWg_8';

const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verify() {
  console.log('🔍 Verifying new database schema...\n');

  const results = {
    tables: {},
    crudTests: {},
    rlsTests: {},
  };

  // Test 1: Verify media_content columns
  console.log('📋 1. Checking media_content table structure...');
  const { data: mediaInsert, error: mediaInsertErr } = await serviceClient
    .from('media_content')
    .insert({
      imdb_id: 'tt0000001',
      name: 'Test Movie',
      year: 2024,
      type: 'movie',
      youtube_id: 'test123',
    })
    .select()
    .single();

  if (mediaInsertErr) {
    console.log(`   ❌ Insert failed: ${mediaInsertErr.message}`);
    results.crudTests.media_content = { insert: false, error: mediaInsertErr.message };
  } else {
    console.log(`   ✅ Insert success: ${mediaInsert.internal_id}`);
    console.log(`   Columns: ${Object.keys(mediaInsert).join(', ')}`);
    results.crudTests.media_content = { insert: true, id: mediaInsert.internal_id };
    results.tables.media_content = Object.keys(mediaInsert);

    // Test 2: Insert overall_triggers
    console.log('\n📋 2. Checking overall_triggers table structure...');
    const { data: overallInsert, error: overallInsertErr } = await serviceClient
      .from('overall_triggers')
      .insert({
        media_id: mediaInsert.internal_id,
        violence_severity: 2,
        blood_severity: 1,
      })
      .select()
      .single();

    if (overallInsertErr) {
      console.log(`   ❌ Insert failed: ${overallInsertErr.message}`);
      results.crudTests.overall_triggers = { insert: false, error: overallInsertErr.message };
    } else {
      console.log(`   ✅ Insert success`);
      const severityCols = Object.keys(overallInsert).filter((k) => k.endsWith('_severity'));
      console.log(`   Severity columns: ${severityCols.length}`);
      results.crudTests.overall_triggers = { insert: true, severityColumns: severityCols.length };
      results.tables.overall_triggers = Object.keys(overallInsert);
    }

    // Test 3: Insert timestamp_triggers
    console.log('\n📋 3. Checking timestamp_triggers table structure...');
    const { data: tsInsert, error: tsInsertErr } = await serviceClient
      .from('timestamp_triggers')
      .insert({
        media_id: mediaInsert.internal_id,
        category: 'violence',
        start_time: 60,
        end_time: 120,
        description: 'Test violence scene',
      })
      .select()
      .single();

    if (tsInsertErr) {
      console.log(`   ❌ Insert failed: ${tsInsertErr.message}`);
      results.crudTests.timestamp_triggers = { insert: false, error: tsInsertErr.message };
    } else {
      console.log(`   ✅ Insert success: ${tsInsert.id}`);
      console.log(`   Columns: ${Object.keys(tsInsert).join(', ')}`);
      results.crudTests.timestamp_triggers = { insert: true, id: tsInsert.id };
      results.tables.timestamp_triggers = Object.keys(tsInsert);

      // Test 4: Insert timestamp_votes
      console.log('\n📋 4. Checking timestamp_votes table structure...');
      const testUserId = '00000000-0000-0000-0000-000000000001';
      const { data: voteInsert, error: voteInsertErr } = await serviceClient
        .from('timestamp_votes')
        .insert({
          timestamp_id: tsInsert.id,
          user_id: testUserId,
          vote_type: 'up',
        })
        .select()
        .single();

      if (voteInsertErr) {
        console.log(`   ❌ Insert failed: ${voteInsertErr.message}`);
        results.crudTests.timestamp_votes = { insert: false, error: voteInsertErr.message };
      } else {
        console.log(`   ✅ Insert success`);
        results.crudTests.timestamp_votes = { insert: true };
        results.tables.timestamp_votes = Object.keys(voteInsert);

        // Check if vote counting trigger worked
        const { data: updatedTs } = await serviceClient
          .from('timestamp_triggers')
          .select('upvotes, vote_score')
          .eq('id', tsInsert.id)
          .single();

        if (updatedTs && updatedTs.upvotes === 1 && updatedTs.vote_score === 1) {
          console.log(
            `   ✅ Vote counting trigger works! (upvotes: ${updatedTs.upvotes}, score: ${updatedTs.vote_score})`
          );
          results.crudTests.vote_trigger = { works: true };
        } else {
          console.log(`   ⚠️ Vote counting trigger may not be working`);
          results.crudTests.vote_trigger = { works: false, data: updatedTs };
        }

        // Cleanup vote
        await serviceClient.from('timestamp_votes').delete().eq('id', voteInsert.id);
      }

      // Cleanup timestamp
      await serviceClient.from('timestamp_triggers').delete().eq('id', tsInsert.id);
    }

    // Cleanup overall_triggers and media_content
    await serviceClient.from('overall_triggers').delete().eq('media_id', mediaInsert.internal_id);
    await serviceClient.from('media_content').delete().eq('internal_id', mediaInsert.internal_id);
  }

  // Test 5: RLS with anonymous user
  console.log('\n📋 5. Testing RLS policies...');
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authData } = await anonClient.auth.signInAnonymously();

  if (authData?.user) {
    console.log(`   ✅ Anonymous auth: ${authData.user.id}`);

    // Test read access
    const { data: readMedia, error: readErr } = await anonClient
      .from('media_content')
      .select('*')
      .limit(1);
    if (!readErr) {
      console.log(`   ✅ Anonymous read media_content: works`);
      results.rlsTests.read_media_content = true;
    } else {
      console.log(`   ❌ Anonymous read media_content: ${readErr.message}`);
      results.rlsTests.read_media_content = false;
    }

    const { data: readTs, error: readTsErr } = await anonClient
      .from('timestamp_triggers')
      .select('*')
      .limit(1);
    if (!readTsErr) {
      console.log(`   ✅ Anonymous read timestamp_triggers: works`);
      results.rlsTests.read_timestamp_triggers = true;
    } else {
      console.log(`   ❌ Anonymous read timestamp_triggers: ${readTsErr.message}`);
      results.rlsTests.read_timestamp_triggers = false;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(60));

  const allCrudPass = Object.values(results.crudTests).every((t) => t.insert !== false);
  const allRlsPass = Object.values(results.rlsTests).every((t) => t === true);

  console.log(`\n✅ CRUD Tests: ${allCrudPass ? 'ALL PASSED' : 'SOME FAILED'}`);
  console.log(`✅ RLS Tests: ${allRlsPass ? 'ALL PASSED' : 'SOME FAILED'}`);

  console.log('\n📋 Table columns:');
  for (const [table, cols] of Object.entries(results.tables)) {
    console.log(`   ${table}: ${cols.length} columns`);
  }

  if (allCrudPass && allRlsPass) {
    console.log('\n🎉 DATABASE SCHEMA VERIFICATION COMPLETE - ALL TESTS PASSED!');
  }
}

verify().catch(console.error);
