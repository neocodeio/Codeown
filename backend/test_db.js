
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runSQL() {
    const sqlCommands = [
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS github_url TEXT;',
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_url TEXT;',
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url TEXT;',
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS website_url TEXT;'
    ];

    for (const sql of sqlCommands) {
        console.log(`Executing: ${sql}`);
        // Supabase JS client doesn't have a direct way to run raw SQL unless using a specific RPC or extension
        // But we can try using the REST API if we have the key
    }
}

// Actually, I can use the postgres-js or similar if installed, but I don't know the DB password.
// Alternatively, I can use the supabase rpc if the user has one for migrations.

// Wait, I can just use the supabase client to check if I can update those fields.
async function testUpdate() {
    const testId = 'test_' + Date.now();
    // Try to insert a row with those columns
    const { error } = await supabase.from('users').insert({
        id: testId,
        github_url: 'test'
    });

    if (error) {
        console.error('FAILED to insert with github_url:', error.message);
        if (error.message.includes('column "github_url" of relation "users" does not exist')) {
            console.log('CRITICAL: Columns missing in database!');
        }
    } else {
        console.log('SUCCESS: Columns exist!');
        // Clean up
        await supabase.from('users').delete().eq('id', testId);
    }
}

testUpdate();
