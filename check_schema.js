import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual parser for .env
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
            if (match) {
                let value = match[2];
                // Remove quotes if present
                if (value && value.length > 0 && value.charAt(0) === '"') {
                    value = value.replace(/^"|"$/g, '');
                }
                env[match[1]] = value;
            }
        });
        return env;
    } catch (err) {
        console.error('Error loading .env:', err);
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking products table schema...');

    // Try to select a single product to see the returned columns
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns found in products table:', Object.keys(data[0]));
        const hasWholesale = Object.keys(data[0]).includes('wholesale_prices');
        console.log('Has wholesale_prices column:', hasWholesale);
    } else {
        console.log('No products found, checking empty set keys might not work. Trying to insert dry run...');
        // We can try to select specific column 'wholesale_prices' from empty set?
        const { error: colError } = await supabase
            .from('products')
            .select('wholesale_prices')
            .limit(1);

        if (colError) {
            console.log('Select wholesale_prices failed:', colError.message);
        } else {
            console.log('Select wholesale_prices succeeded, column likely exists.');
        }
    }
}

checkSchema();
