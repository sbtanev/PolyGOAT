"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/data";
import { AVATAR_PRESETS } from "@/lib/avatars";
import { SUPABASE_URL } from "@/lib/supabase/env";

export type ProfileState = { error?: string; saved?: boolean } | undefined;

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

export async function updateProfile(_: ProfileState, formData: FormData): Promise<ProfileState> {
  const profile = await requireProfile();
  const displayName = String(formData.get("display_name") ?? "").trim().slice(0, 50);
  const username = String(formData.get("username") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim().slice(0, 200);
  const preset = String(formData.get("avatar_preset") ?? "");

  if (!displayName || !username) return { error: "required" };
  if (!USERNAME_RE.test(username)) return { error: "usernameFormat" };

  const supabase = await createClient();
  if (username.toLowerCase() !== profile.username.toLowerCase()) {
    const { data: free } = await supabase.rpc("username_available", { p_username: username });
    if (!free) return { error: "usernameTaken" };
  }

  const changes: Record<string, string | null> = { display_name: displayName, username, bio: bio || null };
  // Picking a preset goat replaces an uploaded photo.
  if (preset && preset !== "keep" && AVATAR_PRESETS.some((p) => p.id === preset)) {
    changes.avatar_preset = preset;
    changes.avatar_url = null;
  }

  const { error } = await supabase.from("profiles").update(changes).eq("id", profile.id);
  if (error) return { error: error.code === "23505" ? "usernameTaken" : "generic" };

  revalidatePath("/", "layout");
  return { saved: true };
}

/** Saves the URL of a photo the browser just uploaded to the avatars bucket. */
export async function setAvatarUrl(url: string) {
  const profile = await requireProfile();
  const allowedPrefix = `${SUPABASE_URL}/storage/v1/object/public/avatars/${profile.id}/`;
  if (!url.startsWith(allowedPrefix)) return;

  const supabase = await createClient();
  await supabase.from("profiles").update({ avatar_url: url }).eq("id", profile.id);
  revalidatePath("/", "layout");
}

export async function removeLanguage(formData: FormData) {
  const profile = await requireProfile();
  const code = String(formData.get("language") ?? "");
  const supabase = await createClient();
  await supabase.from("user_languages").delete().eq("user_id", profile.id).eq("language_code", code);
  revalidatePath("/", "layout");
}
