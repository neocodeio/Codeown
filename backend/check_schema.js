
import { supabase } from "./src/lib/supabase.js";

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'notifications' });
  if (error) {
    console.error("Error checking schema:", error);
    // Fallback: try a simple select to see if it fails
    const { error: selectError } = await supabase.from('notifications').select('article_id').limit(1);
    if (selectError) {
      console.log("COLUMN article_id DOES NOT EXIST in notifications table.");
    } else {
      console.log("COLUMN article_id EXISTS in notifications table.");
    }
  } else {
    console.log("Columns:", data);
  }
}

checkSchema();
