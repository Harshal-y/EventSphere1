
import { createClient } from
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// Replace these two values with your own Supabase credentials.
const SUPABASE_URL = "https://yfggiwqbzqvscgzlorhj.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Hx6K7KS21igI60kiKDa6AQ_B_z5GShG";

// Create the Supabase client.
export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

console.log("EventSphere Supabase client initialized.");
