import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dkrosrrlkerbkjggrvuy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcm9zcnJsa2VyYmtqZ2dydnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MDUwMTAsImV4cCI6MjA4NjE4MTAxMH0.HNQFArdiVcsVI08SBbPLKTZY5uoBHBJkS3oLz6ng9Lc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectTable() {
    console.log('--- Inspecting upgrade_requests table ---');

    const { data, error } = await supabase
        .from('upgrade_requests')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error selecting from upgrade_requests:', error);
    } else {
        console.log('Sample data from upgrade_requests:', data);
    }
}

inspectTable();
