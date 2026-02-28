import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
    const sqlPath = path.join(__dirname, '..', 'supabase', 'auto_create_company_trigger.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Since supabase-js doesn't natively expose raw SQL execution, we use RPC
    // assuming 'exec_sql' exists, or we output instructions to paste in dashboard
    console.log('To apply this fix, the SQL must be executed via the Supabase Dashboard SQL Editor.');
    console.log('Script path:', sqlPath);
}

applyMigration();
