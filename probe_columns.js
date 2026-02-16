import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dkrosrrlkerbkjggrvuy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcm9zcnJsa2VyYmtqZ2dydnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MDUwMTAsImV4cCI6MjA4NjE4MTAxMH0.HNQFArdiVcsVI08SBbPLKTZY5uoBHBJkS3oLz6ng9Lc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function probe() {
    const { data, error } = await supabase
        .from('upgrade_requests')
        .insert([{ non_existent_column: 'test' }]);

    if (error) {
        console.log('Error hint:', error.hint);
        console.log('Error message:', error.message);
    }
}
probe();
