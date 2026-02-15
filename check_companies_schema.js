
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dkrosrrlkerbkjggrvuy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcm9zcnJsa2VyYmtqZ2dydnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MDUwMTAsImV4cCI6MjA4NjE4MTAxMH0.HNQFArdiVcsVI08SBbPLKTZY5uoBHBJkS3oLz6ng9Lc';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase
        .from('companies')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching companies:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Company keys:', Object.keys(data[0]));
        console.log('Socials value:', data[0].socials);
    } else {
        console.log('No companies found to check schema.');
    }
}

checkSchema();
