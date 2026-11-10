"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/data";

export async function addLanguage(formData: FormData) {
  const profile = await requireProfile();
  const language = String(formData.get("language") ?? "");
  const source = String(formData.get("source") ?? "");
  if (!language || !source || language === source) return;

  const supabase = await createClient();
  const { data: lang } = await supabase
    .from("languages")
    .select("code")
    .eq("code", language)
    .eq("is_active", true)
    .maybeSingle();
  if (!lang) return;

  await supabase
    .from("user_languages")
    .upsert({ user_id: profile.id, language_code: language, source_language: source });

  revalidatePath("/", "layout");
  redirect("/home");
}
