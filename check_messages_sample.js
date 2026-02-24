
const URL = 'https://dkrosrrlkerbkjggrvuy.supabase.co/rest/v1/ticket_messages?ticket_id=eq.385d664f-e69a-4ea5-93b1-ea07bceaa831&select=*';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcm9zcnJsa2VyYmtqZ2dydnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MDUwMTAsImV4cCI6MjA4NjE4MTAxMH0.HNQFArdiVcsVI08SBbPLKTZY5uoBHBJkS3oLz6ng9Lc';

async function check() {
    try {
        // We'll try to fetch without filters first to see if we get ANY rows with this key
        const res = await fetch('https://dkrosrrlkerbkjggrvuy.supabase.co/rest/v1/ticket_messages?select=*&limit=5', {
            headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
        });
        const data = await res.json();
        console.log('Sample messages:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}
check();
