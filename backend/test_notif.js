
import { supabase } from "./src/lib/supabase.js";

async function testNotification() {
    console.log("Testing notification insertion...");
    
    // We try to insert a fake notification into the DB to see if it fails due to missing column
    const { data: testUser } = await supabase.from("users").select("id").limit(1).single();
    if (!testUser) {
        console.log("No users found to test with.");
        return;
    }

    const testNotif = {
        user_id: testUser.id,
        actor_id: testUser.id,
        type: 'like',
        article_id: 1, // This will reveal if the column exists
        read: false,
        metadata: {}
    };

    const { error } = await supabase.from("notifications").insert(testNotif);
    
    if (error) {
        console.error("NOTIFICATION INSERT FAILED!");
        console.error("Error Code:", error.code);
        console.error("Error Message:", error.message);
        if (error.message.includes("column \"article_id\" of relation \"notifications\" does not exist")) {
            console.log("\n>>> SUGGESTION: Run the SQL migration to add 'article_id' to 'notifications' table.");
        }
    } else {
        console.log("NOTIFICATION INSERT SUCCESSFUL! Column exists.");
        // Clean up
        await supabase.from("notifications").delete().eq("user_id", testUser.id).eq("article_id", 1);
    }
}

testNotification();
