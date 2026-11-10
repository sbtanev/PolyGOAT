export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

/** False until the Supabase keys have been added (e.g. in Vercel settings). */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
