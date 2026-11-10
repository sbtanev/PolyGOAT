"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/data";

import { EDITABLE_TABLES, type EditableTable, type SaveState } from "./tables";

async function requireAdmin() {
  const profile = await requireProfile();
  if (profile.role !== "admin") throw new Error("admins only");
}

/** Save one word/phrase from the item editor form. */
export async function saveItem(_: SaveState, formData: FormData): Promise<SaveState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const lang = String(formData.get("language_code") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  if (!id || !lang || !text) return { error: "id, language and text are required" };

  const translations: Record<string, string> = {};
  const status: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    const m = /^tr_(\w+)$/.exec(key);
    if (m && String(value).trim()) translations[m[1]] = String(value).trim();
    const st = /^st_(\w+)$/.exec(key);
    if (st) status[st[1]] = String(value);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("items").upsert({
    id,
    language_code: lang,
    text,
    kind: String(formData.get("kind") ?? "word"),
    native: String(formData.get("native") ?? "").trim() || null,
    translations,
    translation_status: status,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/content");
  return { ok: true };
}

/** Save a row of any other content table from its JSON. */
export async function saveRow(_: SaveState, formData: FormData): Promise<SaveState> {
  await requireAdmin();
  const table = String(formData.get("table") ?? "") as EditableTable;
  const lang = String(formData.get("language_code") ?? "");
  if (!EDITABLE_TABLES.includes(table)) return { error: "unknown table" };

  let row: Record<string, unknown>;
  try {
    row = JSON.parse(String(formData.get("json") ?? ""));
  } catch {
    return { error: "invalid JSON" };
  }
  if (!row || typeof row !== "object" || Array.isArray(row) || !row.id) return { error: "the JSON needs an \"id\"" };
  row.language_code = lang;

  const supabase = await createClient();
  const { error } = await supabase.from(table).upsert(row);
  if (error) return { error: error.message };
  revalidatePath("/admin/content");
  return { ok: true };
}

export async function deleteRow(formData: FormData) {
  await requireAdmin();
  const table = String(formData.get("table") ?? "");
  const id = String(formData.get("id") ?? "");
  if (![...EDITABLE_TABLES, "items"].includes(table)) return;
  const supabase = await createClient();
  await supabase.from(table).delete().eq("id", id);
  revalidatePath("/admin/content");
}
