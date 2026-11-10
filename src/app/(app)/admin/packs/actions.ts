"use server";

import { revalidatePath } from "next/cache";
import { BUNDLED_PACKS } from "@/content/packs";
import { importPack, type ImportResult } from "@/lib/packs/import";
import { requireProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export async function importBundledPack(_: ImportResult | undefined, formData: FormData): Promise<ImportResult> {
  const profile = await requireProfile();
  if (profile.role !== "admin") return { ok: false, errors: ["admins only"], counts: {} };

  const code = String(formData.get("code") ?? "");
  const pack = BUNDLED_PACKS.find((p) => p.language.code === code);
  if (!pack) return { ok: false, errors: [`no bundled pack "${code}"`], counts: {} };

  const supabase = await createClient();
  const result = await importPack(supabase, pack);
  revalidatePath("/", "layout");
  return result;
}
