
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createTable() {
    const sql = `
    CREATE TABLE IF NOT EXISTS cofounder_requests (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        skills TEXT[],
        hours_per_week INTEGER,
        reason_to_join TEXT,
        contribution TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Add RLS or other settings if needed
    `;
    
    // Supabase doesn't expose a direct SQL execution via JS client usually unless enabled via RPC
    // Let's try to just insert into a non-existent table and see if it fails (not helpful for creation)
    
    // Instead, I'll try to use the 'exec_sql' RPC which is commonly added in these environments
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
        console.error('Error creating table:', error);
        console.log('Falling back to direct check...');
        // If RPC fails, I might have to ask or find another way.
    } else {
        console.log('Table cofounder_requests created or already exists.');
    }
}

createTable();
