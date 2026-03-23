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

async function testStudentFiltering() {
  console.log('--- 1. Fetching Teacher Profile ---');
  // First let's get any teacher who has class_name set
  const { data: teacherDataArray, error: tErr } = await supabase
    .from('profiles')
    .select('display_name, role, class_name, college_name, school_name')
    .eq('role', 'teacher')
    .not('class_name', 'is', null)
    .limit(1);

  if (tErr || !teacherDataArray || teacherDataArray.length === 0) {
    console.error('Failed to fetch a teacher:', tErr?.message || 'No teacher found');
    return;
  }
  
  const teacherData = teacherDataArray[0];
  console.log('Teacher Profile:', teacherData);

  const role = teacherData.role;
  const userClass = teacherData.class_name;
  const userCollege = teacherData.college_name;
  const userSchool = teacherData.school_name;

  console.log('\n--- 2. Simulating Frontend Query Logic ---');
  let query = supabase
    .from("profiles")
    .select("display_name, role, school_name, college_name, class_name")
    .eq("role", "user");

  if (role === "teacher") {
    console.log('Applying teacher filters...');
    if (userSchool) {
      console.log('-> Filtering by school_name =', userSchool);
      query = query.eq("school_name", userSchool);
    }
    if (userCollege) {
      console.log('-> Filtering by college_name =', userCollege);
      query = query.eq("college_name", userCollege);
    }
    if (userClass) {
      console.log('-> Filtering by class_name =', userClass);
      query = query.eq("class_name", userClass);
    }
  }

  const { data: matchedStudents, error: queryErr } = await query;
  if (queryErr) {
    console.error("Query failed:", queryErr.message);
  } else {
    console.log(`\nQuery matched ${matchedStudents.length} students.`);
    console.log('Matched Students:', matchedStudents);
    
    // Now let's see how many total users exist to compare
    const { data: allUsers } = await supabase.from('profiles').select('display_name, role, class_name').eq('role', 'user');
    console.log(`\nFor reference: There are ${allUsers?.length || 0} total students in the database.`);
  }
}

testStudentFiltering();
