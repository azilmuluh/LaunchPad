import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    envVars[match[1]] = value;
  }
});

const url = envVars.NEXT_PUBLIC_SUPABASE_URL || envVars.VITE_SUPABASE_URL;
const key = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function check() {
  console.log('--- Checking posts ---');
  const postsRes = await supabase.from('lp_posts').select('*');
  console.log('Posts count:', postsRes.data ? postsRes.data.length : 'error');
  if (postsRes.error) {
    console.error('Posts error:', postsRes.error);
  } else {
    console.log('Sample posts:', postsRes.data.slice(0, 5));
  }

  console.log('--- Checking comments ---');
  const commentsRes = await supabase.from('lp_comments').select('*');
  console.log('Comments count:', commentsRes.data ? commentsRes.data.length : 'error');
  if (commentsRes.error) {
    console.error('Comments error:', commentsRes.error);
  } else {
    console.log('Sample comments:', commentsRes.data.slice(0, 5));
  }
}

check();
