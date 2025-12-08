#!/usr/bin/env node
/**
 * Script to query Supabase database schema
 * Run with: node scripts/query-db-schema.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rzkynplgzcxlaecxlylm.supabase.co';
const SUPABASE_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6a3lucGxnemN4bGFlY3hseWxtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjcyMTY5MCwiZXhwIjoyMDc4Mjk3NjkwfQ.Vt7nZAboEbz6r2bWfGtchGSqY6RxnaeeNF8QC5x_8Co';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function querySchema() {
  console.log('🔍 Querying Supabase database schema...\n');

  try {
    // Query all tables in the public schema
    const { data: tables, error: tablesError } = await supabase.rpc('get_tables_info');

    if (tablesError) {
      console.log('RPC not available, trying direct SQL...');

      // Try direct SQL query via Supabase
      const { data: sqlResult, error: sqlError } = await supabase
        .from('pg_catalog.pg_tables')
        .select('tablename')
        .eq('schemaname', 'public');

      if (sqlError) {
        console.error('SQL Error:', sqlError);

        // Fallback: try to list some known tables
        console.log('\n📋 Trying to access known tables...\n');

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
          const { data, error, count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

          if (!error) {
            console.log(`✅ Table EXISTS: ${table} (${count ?? 0} rows)`);

            // Try to get one row to see columns
            const { data: sample } = await supabase.from(table).select('*').limit(1);

            if (sample && sample.length > 0) {
              console.log(`   Columns: ${Object.keys(sample[0]).join(', ')}`);
            }
          } else {
            console.log(`❌ Table NOT FOUND: ${table} (${error.message})`);
          }
        }
      } else {
        console.log('Tables found:', sqlResult);
      }
    } else {
      console.log('Tables:', tables);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

querySchema();
