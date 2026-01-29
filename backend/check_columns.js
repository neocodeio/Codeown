
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addColumns() {
    console.log('Attempting to add columns to users table...');
    // Since we can't run raw SQL easily via the JS client without an RPC,
    // we'll try to use a little trick if possible, or just report if we can't.
    // Actually, some users have an 'exec_sql' or similar RPC.

    // But another way is to just try to select them and see if it fails.
    const { error } = await supabase.from('users').select('github_url, twitter_url, linkedin_url, website_url').limit(1);

    if (error) {
        console.log('Columns likely missing:', error.message);
        console.log('Since I cannot run raw SQL directly, please ensure the following columns exist in the users table:');
        console.log('github_url (TEXT), twitter_url (TEXT), linkedin_url (TEXT), website_url (TEXT)');
    } else {
        console.log('Columns already exist in the database.');
    }
}

addColumns();
