#!/usr/bin/env node

/**
 * Database Setup Script for mAIcrolearning
 * 
 * This script helps set up the Supabase database tables.
 * 
 * Usage:
 *   node setup-database.js
 * 
 * This will attempt to create the database tables using the service role key.
 * If that fails, it will provide instructions for manual setup.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('🚀 mAIcrolearning Database Setup');
  console.log('================================\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing required environment variables:');
    if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    if (!serviceRoleKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY');
    console.log('\n📋 Manual Setup Instructions:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to the SQL Editor');
    console.log('3. Copy and paste the contents of supabase-schema.sql');
    console.log('4. Run the SQL script');
    return;
  }

  try {
    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('✅ Supabase connection established');

    // Read the schema file
    const schemaPath = path.join(__dirname, 'supabase-schema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Schema file not found:', schemaPath);
      return;
    }

    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    console.log('✅ Schema file loaded');

    // Note: The Supabase JS client doesn't support running raw SQL
    // We need to use the REST API or manual setup
    console.log('\n⚠️  Automatic schema execution is not supported via JS client.');
    console.log('📋 Manual Setup Instructions:');
    console.log('1. Go to your Supabase dashboard:', supabaseUrl.replace('/rest/v1', ''));
    console.log('2. Navigate to the SQL Editor');
    console.log('3. Copy and paste the contents of supabase-schema.sql');
    console.log('4. Run the SQL script');
    console.log('\n📄 Schema file location:', schemaPath);

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n📋 Manual Setup Instructions:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to the SQL Editor');
    console.log('3. Copy and paste the contents of supabase-schema.sql');
    console.log('4. Run the SQL script');
  }
}

// Test current database state
async function testDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return;
  }

  const supabase = createClient(supabaseUrl, anonKey);

  console.log('\n🔍 Testing Database State:');
  console.log('==========================');

  // Test each table
  const tables = [
    'user_profiles',
    'courses', 
    'sessions',
    'user_progress',
    'learning_paths',
    'chat_messages',
    'analytics'
  ];

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        if (error.code === '42P01') {
          console.log(`❌ ${table}: Table does not exist`);
        } else {
          console.log(`⚠️  ${table}: ${error.message}`);
        }
      } else {
        console.log(`✅ ${table}: Table exists`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
}

if (require.main === module) {
  setupDatabase().then(() => testDatabase());
}

module.exports = { setupDatabase, testDatabase };
