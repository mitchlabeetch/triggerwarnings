#!/usr/bin/env node
/**
 * Script to get detailed column info for all Supabase tables
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rzkynplgzcxlaecxlylm.supabase.co';
const SUPABASE_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6a3lucGxnemN4bGFlY3hseWxtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjcyMTY5MCwiZXhwIjoyMDc4Mjk3NjkwfQ.Vt7nZAboEbz6r2bWfGtchGSqY6RxnaeeNF8QC5x_8Co';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function getTableDetails() {
  console.log('🔍 Getting detailed column info for all tables...\n');

  const tablesToCheck = [
    'triggers',
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

    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      continue;
    }

    console.log(`   Rows: ${count ?? 0}`);

    // Get sample data to see columns
    const { data: sample, error: sampleErr } = await supabase.from(table).select('*').limit(1);

    if (!sampleErr && sample && sample.length > 0) {
      console.log(`   Columns with sample data:`);
      for (const [col, val] of Object.entries(sample[0])) {
        const type = val === null ? 'NULL' : typeof val;
        const preview = val === null ? 'null' : JSON.stringify(val).substring(0, 50);
        console.log(`     - ${col}: (${type}) ${preview}`);
      }
    } else if (!sampleErr) {
      // Empty table - try to get column names from RPC or schema
      console.log(`   Table exists but is empty`);
    }
  }

  // Now specifically check the triggers table data
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 TRIGGERS TABLE - SAMPLE DATA`);
  console.log(`${'='.repeat(60)}`);

  const { data: triggers } = await supabase.from('triggers').select('*').limit(3);

  if (triggers && triggers.length > 0) {
    console.log(JSON.stringify(triggers, null, 2));
  }
}

getTableDetails();
