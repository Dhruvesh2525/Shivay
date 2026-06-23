import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import ws from 'ws';

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    } else if (val.startsWith("'") && val.endsWith("'")) {
      val = val.substring(1, val.length - 1);
    }
    env[key] = val;
  }
});

async function run() {
  const supabase = createClient(
    env['NEXT_PUBLIC_SUPABASE_URL'],
    env['SUPABASE_SERVICE_ROLE_KEY'],
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      realtime: {
        transport: ws as any,
      },
    }
  );

  const { data, error } = await supabase
    .rpc('get_policies_debug'); // If we have an RPC, or we can use custom sql?

  // Since we can't run raw SQL unless there is an RPC, let's check if we can query pg_policies using standard postgrest if it's exposed, or run a query.
  // Wait, does Postgrest expose pg_policies? Usually no.
  // Let's see if there is any other way. What RPCs are defined in the database?
  
  console.log('Error:', error);
  console.log('Policies:', data);
  
  process.exit(0);
}

run();
