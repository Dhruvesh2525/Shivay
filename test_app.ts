// test_app.ts
import fs from 'fs';
import path from 'path';

// Manually load env variables from .env.local for command-line execution
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach((line) => {
      const parts = line.trim().split('=');
      if (parts.length >= 2 && !line.startsWith('#')) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim();
        process.env[key] = val;
      }
    });
  }
} catch (e) {
  console.error('Failed to parse .env.local file:', e);
}

import { createAdminClient } from './src/lib/supabase/admin';

async function runCheck() {
  console.log('--- Database Verification Script ---');
  const adminSupabase = createAdminClient();

  try {
    // 1. Verify connection & profiles table
    console.log('1. Checking connection to profiles table...');
    const { data: profiles, error: profError } = await adminSupabase
      .from('profiles')
      .select('id, email, role')
      .limit(5);

    if (profError) {
      console.error('Error querying profiles table. Have you run the migrations in Supabase SQL editor yet?', profError);
      return;
    }

    console.log('✓ Successfully connected to profiles. Active accounts count:', profiles.length);
    console.log('Profiles in DB:', profiles);

    // 2. Check courts table (seeded data)
    console.log('\n2. Checking seeded courts data...');
    const { data: courts, error: courtError } = await adminSupabase
      .from('courts')
      .select('id, name, sport');

    if (courtError) {
      console.error('Error querying courts:', courtError);
    } else {
      console.log(`✓ Seeded courts count: ${courts.length}`);
      courts.forEach(c => console.log(`  - ${c.name} (${c.sport})`));
    }

    // 3. Search for admin@test.com
    console.log('\n3. Searching for user admin@test.com...');
    // We query auth.users first
    const { data: { users }, error: authError } = await adminSupabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error listing auth users:', authError);
    } else {
      const adminUser = users.find(u => u.email === 'admin@test.com');
      if (adminUser) {
        console.log(`✓ Found user admin@test.com in Auth! UUID: ${adminUser.id}`);
        
        // Check if profile role is super_admin
        const profile = profiles.find(p => p.id === adminUser.id);
        if (profile) {
          console.log(`✓ Profile role in DB: "${profile.role}"`);
          if (profile.role !== 'super_admin') {
            console.log('⚠️  User is not a Super Admin yet. Running query to upgrade role...');
            
            const { error: updateError } = await adminSupabase
              .from('profiles')
              .update({ role: 'super_admin' })
              .eq('id', adminUser.id);
              
            if (updateError) {
              console.error('Failed to update role:', updateError);
            } else {
              console.log('✓ Role upgraded to "super_admin" successfully!');
            }
          }
        } else {
          console.log('⚠️  User exists in auth but no profile row has been created yet. User needs to complete registration inside the app first.');
        }
      } else {
        console.log('❌ User admin@test.com not found in auth. Please register this account on the login/register screen first.');
      }
    }
  } catch (err) {
    console.error('Unexpected error running script:', err);
  }
}

runCheck();
