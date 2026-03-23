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

async function simulateStudentMatch() {
  console.log('--- 1. Fetching Teacher (刘浩) Profile ---');
  const { data: teacherDataArray } = await supabase
    .from('profiles')
    .select('display_name, role, class_name, college_name, school_name')
    .eq('role', 'teacher')
    .not('class_name', 'is', null)
    .limit(1);

  const teacherData = teacherDataArray[0];
  console.log('Teacher Profile:', teacherData);

  const role = teacherData.role;
  const userClass = teacherData.class_name;
  const userCollege = teacherData.college_name;
  const userSchool = teacherData.school_name;

  console.log('\n--- 2. Updating one existing student to match this teacher ---');
  // Find a random student
  const { data: randomStudents } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .eq('role', 'user')
    .limit(1);
    
  if (!randomStudents || randomStudents.length === 0) {
    console.log('No students found to update.');
    return;
  }
  
  const targetStudent = randomStudents[0];
  console.log('Target Student for matching:', targetStudent.display_name);
  
  // Update this student to be in the teacher's class
  const { error: updateErr } = await supabase
    .from('profiles')
    .update({
      school_name: userSchool,
      college_name: userCollege,
      class_name: userClass
    })
    .eq('user_id', targetStudent.user_id);
    
  if (updateErr) {
    console.error('Failed to update student:', updateErr);
    return;
  }
  
  console.log(`Successfully updated student '${targetStudent.display_name}' to class ${userClass}`);

  console.log('\n--- 3. Running Frontend Query Logic ... ---');
  let query = supabase
    .from("profiles")
    .select("display_name, role, school_name, college_name, class_name")
    .eq("role", "user");

  if (role === "teacher") {
    if (userSchool) query = query.eq("school_name", userSchool);
    if (userCollege) query = query.eq("college_name", userCollege);
    if (userClass) query = query.eq("class_name", userClass);
  }

  const { data: matchedStudents, error: queryErr } = await query;
  if (queryErr) {
    console.error("Query failed:", queryErr.message);
  } else {
    console.log(`Query matched ${matchedStudents.length} students!!`);
    console.log('Matched Students:', matchedStudents);
  }
}

simulateStudentMatch();
