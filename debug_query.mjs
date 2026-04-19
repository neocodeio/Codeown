
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    const { data, error } = await supabase
        .from('posts')
        .select('id, title, content, user_id, created_at, images, attachments, tags, like_count, comment_count, view_count, poll, post_type, code_snippet, project_id, project:projects(id, name:title), user:users!posts_user_id_fkey(id, name, avatar_url, username, is_hirable, is_pro, is_og)', { count: 'exact' })
        .range(0, 19);

    if (error) {
        console.error('Query failed:', error);
    } else {
        console.log('Query succeeded, found', data.length, 'posts');
    }
}

testQuery();
