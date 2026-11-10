// Values pasted into Vercel sometimes carry spaces, quotes or a trailing slash: clean them up.
const clean = (v: string | undefined) => (v ?? "").trim().replace(/^["']|["']$/g, "").trim();

export const SUPABASE_URL = clean(process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/+$/, "");
export const SUPABASE_KEY = clean(
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

/** False until the Supabase keys have been added (e.g. in Vercel settings). */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
