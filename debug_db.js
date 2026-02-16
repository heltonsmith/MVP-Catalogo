
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dkrosrrlkerbkjggrvuy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcm9zcnJsa2VyYmtqZ2dydnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MDUwMTAsImV4cCI6MjA4NjE4MTAxMH0.HNQFArdiVcsVI08SBbPLKTZY5uoBHBJkS3oLz6ng9Lc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debug() {
    try {
        console.log('--- Checking ALL upgrade_requests ---');
        const { data, error } = await supabase.from('upgrade_requests').select('*');
        console.log('Total Records:', data?.length, 'Error:', error);
        if (data) console.log('Data:', JSON.stringify(data, null, 2));

        console.log('\n--- Checking status counts ---');
        if (data) {
            const counts = data.reduce((acc, curr) => {
                acc[curr.status] = (acc[curr.status] || 0) + 1;
                return acc;
            }, {});
            console.log(counts);
        }
    } catch (e) {
        console.error('Execution error:', e);
    }
}

await debug();
console.log('Done.');
