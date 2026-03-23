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
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY; // Using the key from the .env

const supabase = createClient(url, key);

async function checkColumns() {
  console.log('--- Checking profiles schema ---');
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error selecting *:', error.message);
  } else if (data && data.length > 0) {
    console.log('Columns in profiles row:', Object.keys(data[0]));
  } else {
    console.log('Profiles table is empty.');
  }
  
  console.log('\n--- Checking specific columns for "刘浩" ---');
  const { data: lf, error: lfe } = await supabase
    .from('profiles')
    .select('display_name, school_name, college_name, class_name')
    .eq('display_name', '刘浩');
  
  if (lfe) {
    console.error('Query failed, columns may be missing. Error:', lfe.message);
  } else {
    console.log('Data for 刘浩:', lf);
  }
}

checkColumns();
