const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkUnread() {
    const userId = "user_2lV8a7Xzq8W9A3jXoXoXoXoXoXo"; // Replace with actual userId if known, or I'll search for unread first
    
    console.log("Searching for all unread messages in the database...");
    
    // 1. Find all unread messages not sent by the recipient (general check)
    const { data: unread, error } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, content, created_at")
        .eq("is_read", false);

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Found ${unread.length} total unread messages in DB.`);
    
    // Group by conversation
    const grouped = {};
    unread.forEach(m => {
        if (!grouped[m.conversation_id]) grouped[m.conversation_id] = 0;
        grouped[m.conversation_id]++;
    });

    console.log("Unread count per conversation_id:", grouped);
}

checkUnread();
