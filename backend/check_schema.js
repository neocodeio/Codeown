import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkColumns() {
    const { data, error } = await supabase.from('messages').select('*').limit(1)
    if (error) {
        console.error(error)
        return
    }
    if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]))
    } else {
        console.log('No data in messages table to infer columns.')
        // Try to insert a dummy and see
    }
}

checkColumns()
