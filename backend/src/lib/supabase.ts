import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("ERROR: Supabase environment variables are missing!");
  console.error("Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  console.error("Current values:", {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey
  });
}

export const supabase = createClient(
  supabaseUrl || "",
  supabaseKey || ""
);
