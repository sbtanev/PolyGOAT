import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BUNDLED_PACKS } from "@/content/packs";
import { importPack } from "./import";

/**
 * Called when an admin opens the app: any bundled pack whose version differs from the one
 * in the database is imported. New content then goes live without pressing "Update".
 * Packs that were never imported are left alone (an admin imports them once by hand).
 */
export async function autoImportUpdatedPacks(supabase: SupabaseClient) {
  const { data } = await supabase.from("languages").select("code, pack_version");
  const versions = new Map((data ?? []).map((l) => [l.code as string, l.pack_version as string | null]));
  const imported: string[] = [];
  for (const pack of BUNDLED_PACKS) {
    const current = versions.get(pack.language.code);
    if (!current || current === pack.version) continue;
    try {
      const result = await importPack(supabase, pack);
      if (result.ok) imported.push(`${pack.language.code} ${pack.version}`);
      else console.error("auto-import failed", pack.language.code, result.errors);
    } catch (e) {
      console.error("auto-import crashed", pack.language.code, e);
    }
  }
  return imported;
}
