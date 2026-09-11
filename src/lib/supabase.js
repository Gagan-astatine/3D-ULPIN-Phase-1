import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

// If the user pasted a project ID instead of a full URL, automatically format it
if (supabaseUrl && !supabaseUrl.startsWith('http') && !supabaseUrl.includes('placeholder')) {
  // Strip any quotes just in case
  supabaseUrl = supabaseUrl.replace(/["']/g, '');
  supabaseUrl = `https://${supabaseUrl}.supabase.co`;
}

if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
  supabaseUrl = 'https://placeholder-url.supabase.co';
}

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
