import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase URL or Service Role Key. Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file.');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);