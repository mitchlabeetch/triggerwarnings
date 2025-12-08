#!/usr/bin/env node
/**
 * Execute SQL migration via Supabase Management API
 */

import { readFileSync } from 'fs';

const PROJECT_REF = 'rzkynplgzcxlaecxlylm';
const ACCESS_TOKEN = 'sbp_48270b89dde5926e0e9619017edc78b9e564aeb9';

async function executeMigration() {
  console.log('🚀 Executing database migration via Supabase API...\n');

  const sql = readFileSync('./scripts/migration.sql', 'utf-8');

  // Split into smaller chunks for execution
  const statements = sql
    .split(/;\s*\n/)
    .filter((s) => s.trim().length > 0 && !s.trim().startsWith('--'));

  console.log(`📦 Found ${statements.length} SQL statements to execute\n`);

  // Use the Supabase SQL execution endpoint
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: sql,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ API Error:', response.status, errorText);

    // Try alternative approach - execute via pg directly through management API
    console.log('\n🔄 Trying alternative SQL execution approach...');

    // Execute statements one by one
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < Math.min(statements.length, 5); i++) {
      const stmt = statements[i].trim();
      if (!stmt) continue;

      console.log(`\n⏳ Statement ${i + 1}/${statements.length}:`);
      console.log(`   ${stmt.substring(0, 80)}...`);

      const singleResponse = await fetch(
        `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: stmt + ';' }),
        }
      );

      if (singleResponse.ok) {
        console.log(`   ✅ Success`);
        successCount++;
      } else {
        const err = await singleResponse.text();
        console.log(`   ❌ Error: ${err.substring(0, 100)}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Results: ${successCount} success, ${errorCount} errors`);

    if (errorCount > 0) {
      console.log('\n⚠️ Some statements failed. You may need to run the SQL manually:');
      console.log(
        '   1. Go to https://supabase.com/dashboard/project/rzkynplgzcxlaecxlylm/sql/new'
      );
      console.log('   2. Copy contents of scripts/migration.sql');
      console.log('   3. Click "Run"');
    }
  } else {
    const result = await response.json();
    console.log('✅ Migration executed successfully!');
    console.log('Result:', JSON.stringify(result, null, 2));
  }
}

executeMigration().catch(console.error);
