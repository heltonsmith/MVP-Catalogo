const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://dkrosrrlkerbkjggrvuy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcm9zcnJsa2VyYmtqZ2dydnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MDUwMTAsImV4cCI6MjA4NjE4MTAxMH0.HNQFArdiVcsVI08SBbPLKTZY5uoBHBJkS3oLz6ng9Lc'
);

async function testJoins() {
    const userId = '7f0ded9d-ef92-4a9d-bdd5-10401fd9e2fb'; // From user's error message

    console.log('--- 1. Testing standard alias: company:companies(*) ---');
    const res1 = await supabase.from('favorites').select('*, company:companies(*)').eq('user_id', userId).limit(1);
    console.log('Result 1 Error:', res1.error?.message || 'NONE');
    if (res1.error) console.log('Hint 1:', res1.error.hint);

    console.log('\n--- 2. Testing explicit foreign key: company:companies!company_id(*) ---');
    const res2 = await supabase.from('favorites').select('*, company:companies!company_id(*)').eq('user_id', userId).limit(1);
    console.log('Result 2 Error:', res2.error?.message || 'NONE');

    console.log('\n--- 3. Testing direct join without alias: companies(*) ---');
    const res3 = await supabase.from('favorites').select('*, companies(*)').eq('user_id', userId).limit(1);
    console.log('Result 3 Error:', res3.error?.message || 'NONE');

    console.log('\n--- 4. Checking favorites columns ---');
    const res4 = await supabase.from('favorites').select('*').limit(1);
    if (res4.data && res4.data.length > 0) {
        console.log('Columns in favorites:', Object.keys(res4.data[0]));
    } else {
        console.log('Favorites table empty or not readable');
    }
}

testJoins();
