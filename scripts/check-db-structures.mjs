#!/usr/bin/env node
/**
 * Script to check table structures by inspecting information_schema
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rzkynplgzcxlaecxlylm.supabase.co';
const SUPABASE_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6a3lucGxnemN4bGFlY3hseWxtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjcyMTY5MCwiZXhwIjoyMDc4Mjk3NjkwfQ.Vt7nZAboEbz6r2bWfGtchGSqY6RxnaeeNF8QC5x_8Co';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkTableStructures() {
  console.log('🔍 Checking table structures for empty tables...\n');

  const tablesToCheck = [
    'trigger_votes',
    'feedback',
    'media_content',
    'overall_triggers',
    'timestamp_triggers',
    'timestamp_votes',
    'pattern_submissions',
    'votes',
    'user_expertise',
    'pattern_performance',
    'pattern_feedback',
  ];

  for (const table of tablesToCheck) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 TABLE: ${table}`);
    console.log(`${'='.repeat(60)}`);

    // Try to insert a record to see what columns are required
    const { error: insertError } = await supabase.from(table).insert({}).select();

    if (insertError) {
      console.log(`   Schema hints from error: ${insertError.message}`);
      // The error message often reveals column requirements
      if (insertError.details) {
        console.log(`   Details: ${insertError.details}`);
      }
    }

    // Try select to see if there's any info
    const { error: selectError } = await supabase.from(table).select('*').limit(0);

    if (selectError) {
      console.log(`   Select error: ${selectError.message}`);
    }
  }

  // Check if RLS is blocking us
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔒 CHECKING RLS POLICIES`);
  console.log(`${'='.repeat(60)}`);

  // Try to insert into triggers as anon user
  const anonSupabase = createClient(
    SUPABASE_URL,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6a3lucGxnemN4bGFlY3hseWxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MjE2OTAsImV4cCI6MjA3ODI5NzY5MH0.24lj8QXRK-FS8uQQRtA4H--laEDosdGBCGXnmmnWg_8'
  );

  // Sign in anonymously
  const { data: authData } = await anonSupabase.auth.signInAnonymously();

  if (authData?.user) {
    console.log(`   ✅ Anonymous auth works: ${authData.user.id}`);

    // Try to read triggers
    const { data: triggers, error: triggerReadErr } = await anonSupabase
      .from('triggers')
      .select('*')
      .limit(1);

    if (triggerReadErr) {
      console.log(`   ❌ Anonymous read triggers: ${triggerReadErr.message}`);
    } else {
      console.log(`   ✅ Anonymous read triggers: works (${triggers?.length} rows)`);
    }

    // Try to submit a trigger
    const { error: triggerInsertErr } = await anonSupabase.from('triggers').insert({
      video_id: 'test123',
      platform: 'youtube',
      category_key: 'violence',
      start_time: 0,
      end_time: 10,
      status: 'pending',
      submitted_by: authData.user.id,
    });

    if (triggerInsertErr) {
      console.log(`   ❌ Anonymous insert triggers: ${triggerInsertErr.message}`);
    } else {
      console.log(`   ✅ Anonymous insert triggers: works`);
      // Clean up test insert
      await supabase.from('triggers').delete().eq('video_id', 'test123');
    }

    // Try voting
    const { error: voteErr } = await anonSupabase.from('trigger_votes').insert({
      trigger_id: 'a626c5b0-9736-435b-a021-85400920a483',
      user_id: authData.user.id,
      vote_type: 'up',
    });

    if (voteErr) {
      console.log(`   ❌ Anonymous insert trigger_votes: ${voteErr.message}`);
    } else {
      console.log(`   ✅ Anonymous insert trigger_votes: works`);
      // Clean up
      await supabase.from('trigger_votes').delete().eq('user_id', authData.user.id);
    }
  } else {
    console.log(`   ❌ Anonymous auth failed`);
  }
}

checkTableStructures();
