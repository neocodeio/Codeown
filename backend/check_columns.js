
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkColumns() {
    const { data, error } = await supabase.rpc('get_table_columns', { table_name_input: 'projects' });
    if (error) {
        // Fallback if RPC doesn't exist
        const { data: sample, error: sampleError } = await supabase.from('projects').select('*').limit(1);
        if (sampleError) {
            console.error('Error fetching sample:', sampleError);
            return;
        }
        console.log('Columns:', Object.keys(sample[0] || {}));
    } else {
        console.log('Columns:', data);
    }
}

checkColumns();
