const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://dkrosrrlkerbkjggrvuy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcm9zcnJsa2VyYmtqZ2dydnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MDUwMTAsImV4cCI6MjA4NjE4MTAxMH0.HNQFArdiVcsVI08SBbPLKTZY5uoBHBJkS3oLz6ng9Lc'
);

async function diagnose() {
    console.log('--- Probing Profiles Table ---');
    const { data: profileRow, error: profileError } = await supabase.from('profiles').select('*').limit(1);
    if (profileError) {
        console.log('Profile Error:', profileError.message);
    } else {
        console.log('Profile Columns:', profileRow.length > 0 ? Object.keys(profileRow[0]) : 'Table empty but exists');

        // Try to probe missing columns specifically
        const missingCols = ['rut', 'phone', 'shipping_address', 'avatar_url'];
        for (const col of missingCols) {
            const { error } = await supabase.from('profiles').select(col).limit(1);
            console.log(`Column ${col}: ${error ? 'MISSING' : 'EXISTS'}`);
        }
    }

    console.log('\n--- Probing Favorites Table ---');
    const { data: favRow, error: favError } = await supabase.from('favorites').select('*').limit(1);
    if (favError) {
        console.log('Favorites Error:', favError.message);
    } else {
        console.log('Favorites Columns:', favRow.length > 0 ? Object.keys(favRow[0]) : 'Table empty but exists');

        // Try join
        const { error: joinError } = await supabase.from('favorites').select('*, companies(*)').limit(1);
        console.log('Join with companies results:', joinError ? `FAILED: ${joinError.message}` : 'SUCCESS');
    }

    console.log('\n--- Probing Whatsapp Quotes Table ---');
    const { error: quoteError } = await supabase.from('whatsapp_quotes').select('*').limit(1);
    console.log('Whatsapp Quotes check:', quoteError ? `FAILED: ${quoteError.message}` : 'SUCCESS');
}

diagnose();
