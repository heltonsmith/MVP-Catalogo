
const { createClient } = require('@supabase/supabase-client');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugMessages() {
    console.log('--- Checking Messages ---');
    const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching messages:', error);
        return;
    }

    console.log('Total messages (last 5):', messages.length);
    messages.forEach(m => {
        console.log(`Msg ID: ${m.id}`);
        console.log(`  Content: ${m.content}`);
        console.log(`  Company ID: ${m.company_id}`);
        console.log(`  Customer ID: ${m.customer_id}`);
        console.log(`  Visible to Customer: ${m.visible_to_customer}`);
        console.log(`  Visible to Store: ${m.visible_to_store}`);
        console.log('---');
    });

    console.log('\n--- Checking Companies ---');
    const { data: companies } = await supabase.from('companies').select('id, name, user_id');
    companies.forEach(c => {
        console.log(`Company: ${c.name} (ID: ${c.id}) Owned by: ${c.user_id}`);
    });
}

debugMessages();
