import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) {
    let value = values.join('=').trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[key.trim()] = value;
  }
});

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(url, key);

async function checkLiuHao() {
  console.log('--- Checking for users named "刘浩" ---');
  
  const { data: liuHaos, error } = await supabase
    .from('profiles')
    .select('display_name, role, school_name, college_name, class_name')
    .eq('display_name', '刘浩');

  if (error) {
    console.error('Query failed:', error.message);
  } else {
    console.log(`Found ${liuHaos.length} record(s) matching "刘浩":`);
    console.log(liuHaos);
  }
}

checkLiuHao();
