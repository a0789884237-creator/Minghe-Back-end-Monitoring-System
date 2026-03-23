import { createClient } from '@supabase/supabase-client';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkColumns() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error selecting from profiles:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('Columns found in first row:', Object.keys(data[0]));
  } else {
    console.log('No data in profiles table, trying to insert a dummy to check schema...');
    // We can't easily insert without the full schema, but we can try to select specific columns
    const { error: colError } = await supabase
      .from('profiles')
      .select('college_name, school_name')
      .limit(1);
    
    if (colError) {
      console.error('Specific column selection failed:', colError);
    } else {
      console.log('Success: college_name and school_name exist in schema.');
    }
  }
}

checkColumns();
