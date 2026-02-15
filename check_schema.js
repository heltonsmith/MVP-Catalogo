import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dkrosrrlkerbkjggrvuy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcm9zcnJsa2VyYmtqZ2dydnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MDUwMTAsImV4cCI6MjA4NjE4MTAxMH0.HNQFArdiVcsVI08SBbPLKTZY5uoBHBJkS3oLz6ng9Lc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function probeSchema() {
    console.log('--- Probing Quotes Schema via Omission ---');

    // Try to insert WITHOUT company_id
    const payload = {
        customer_name: 'Test Omission',
        customer_whatsapp: '123456789',
        total: 100
        // No company_id
    };

    console.log('Attempting INSERT without any company ID column...');
    const { data, error } = await supabase
        .from('quotes')
        .insert([payload])
        .select();

    if (error) {
        console.log('INSERT Error Message:', error.message);
        console.log('INSERT Error Details:', error.details);
        console.log('INSERT Error Hint:', error.hint);
        console.log('INSERT Error Code:', error.code);
    } else {
        console.log('INSERT Success (Unexpected):', data);
    }
}

probeSchema();
