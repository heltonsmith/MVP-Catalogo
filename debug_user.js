
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_USER_ID = 'a560fdbf-3a30-4898-be38-d5a0047e85e5';

async function diagnose() {
    console.log(`Diagnosing user: ${TARGET_USER_ID}`);

    // Check Profile
    const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', TARGET_USER_ID)
        .maybeSingle();

    console.log('Profile:', profile || 'Not found', pError || '');

    // Check Company
    const { data: company, error: cError } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', TARGET_USER_ID)
        .maybeSingle();

    console.log('Company:', company || 'Not found', cError || '');

    // Check Auth Metadata (this requires service role key for full detail, but let's see what we get)
    // Actually, we can't easily check auth.users with anon/authenticated key.
    // But we can check if the user exists at least.
}

diagnose();
