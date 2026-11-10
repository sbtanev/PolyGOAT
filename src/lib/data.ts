import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  avatar_preset: string;
  role: "user" | "admin";
  last_seen_at: string;
  created_at: string;
};

export type Language = {
  code: string;
  name: Record<string, string>;
  native_name: string;
  flag: string;
  script: string;
  mascot_accessory: string | null;
  is_active: boolean;
  sort_order: number;
};

export type BaseLanguage = {
  code: string;
  name: Record<string, string>;
  flag: string;
  sort_order: number;
};

export type UserLanguage = {
  user_id: string;
  language_code: string;
  source_language: string;
  level: string;
  started_at: string;
};

/** The signed-in user's profile. Redirects to /login when signed out. */
export const requireProfile = cache(async (): Promise<Profile> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login?error=profile");
  return profile as Profile;
});

export const getLanguages = cache(async (): Promise<Language[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("languages").select("*").order("sort_order");
  return (data ?? []) as Language[];
});

export const getBaseLanguages = cache(async (): Promise<BaseLanguage[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("base_languages")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return (data ?? []) as BaseLanguage[];
});

export async function getUserLanguages(userId: string): Promise<UserLanguage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_languages")
    .select("*")
    .eq("user_id", userId)
    .order("started_at");
  return (data ?? []) as UserLanguage[];
}

export const ONLINE_WINDOW_MS = 5 * 60 * 1000;
export function isOnline(lastSeen: string) {
  return Date.now() - new Date(lastSeen).getTime() < ONLINE_WINDOW_MS;
}
