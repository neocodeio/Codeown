
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkSchema() {
    const { data, error } = await supabase.from('notifications').select('*').limit(1);
    if (error) {
        console.error('Error selecting from notifications:', error);
    } else {
        console.log('Sample notification keys:', Object.keys(data[0] || {}));
    }
}

checkSchema();
