import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL ?? '';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

const isConfigured =
  url.startsWith('https://') &&
  !url.includes('your-project') &&
  key.length > 20 &&
  !key.includes('your-anon-key');

export const supabase = isConfigured ? createClient(url, key) : null;
