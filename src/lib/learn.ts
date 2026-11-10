import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { requireProfile, type Language, type UserLanguage } from "./data";

import { tr, type Tr } from "./tr";

export { tr, type Tr };

export type ItemRow = {
  id: string;
  language_code: string;
  kind: "word" | "phrase" | "sentence";
  text: string;
  translations: Tr;
  translation_status: Tr;
  pos: string | null;
  gender: string | null;
  frequency_rank: number | null;
  native: string | null;
  slang: Record<string, string>;
  notes: Tr;
  extras: Record<string, unknown>;
  audio_url: string | null;
};

export type LessonRow = {
  id: string;
  language_code: string;
  section_id: string | null;
  level: string;
  title: Tr;
  description: Tr;
  item_ids: string[];
  grammar_ids: string[];
  exercises: unknown[];
  sort_order: number;
};

export type SectionRow = {
  id: string;
  slug: string;
  title: Tr;
  description: Tr;
  unlock_after_level: string | null;
  sort_order: number;
};

export type PhrasePackRow = {
  id: string;
  level: string;
  icon: string | null;
  title: Tr;
  description: Tr;
  item_ids: string[];
  sort_order: number;
};

export type DialogueRow = {
  id: string;
  level: string;
  icon: string | null;
  title: Tr;
  situation: Tr;
  speakers: Record<string, { name: string; accessory?: string }>;
  lines: {
    speaker: string;
    text: string;
    translations: Tr;
    choices?: { text: string; translations: Tr; correct: boolean; feedback?: Tr }[];
  }[];
  sort_order: number;
};

export type NoteRow = { id: string; level?: string | null; title: Tr; body: Tr };

/** The current user's enrolment in a language; 404 / redirect when it doesn't apply. */
export const requireEnrollment = cache(async (code: string) => {
  const profile = await requireProfile();
  const supabase = await createClient();
  const [{ data: language }, { data: enrollment }] = await Promise.all([
    supabase.from("languages").select("*").eq("code", code).maybeSingle(),
    supabase.from("user_languages").select("*").eq("user_id", profile.id).eq("language_code", code).maybeSingle(),
  ]);
  if (!language) notFound();
  if (!enrollment) redirect("/onboarding");
  return {
    profile,
    language: language as Language,
    enrollment: enrollment as UserLanguage,
    source: (enrollment as UserLanguage).source_language,
  };
});

export async function getItems(ids: string[]): Promise<ItemRow[]> {
  if (!ids.length) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("items").select("*").in("id", ids);
  const byId = new Map((data ?? []).map((i) => [i.id, i as ItemRow]));
  return ids.map((id) => byId.get(id)).filter((i): i is ItemRow => Boolean(i));
}

/** A pool of other items in the language, used for wrong answer options. */
export async function getDistractorPool(code: string, limit = 60): Promise<ItemRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("items")
    .select("*")
    .eq("language_code", code)
    .order("frequency_rank", { ascending: true, nullsFirst: false })
    .limit(limit);
  return (data ?? []) as ItemRow[];
}

export async function getCourse(code: string, userId: string) {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const [sections, lessons, packs, dialogues, culture, progress, due, mistakes] = await Promise.all([
    supabase.from("sections").select("*").eq("language_code", code).order("sort_order"),
    supabase.from("lessons").select("*").eq("language_code", code).order("sort_order"),
    supabase.from("phrase_packs").select("*").eq("language_code", code).order("sort_order"),
    supabase.from("dialogues").select("id, level, icon, title, situation, sort_order").eq("language_code", code).order("sort_order"),
    supabase.from("culture_notes").select("*").eq("language_code", code).order("sort_order"),
    supabase.from("lesson_progress").select("*").eq("user_id", userId),
    supabase
      .from("review_cards")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("language_code", code)
      .lte("due", now),
    supabase.from("mistakes").select("item_id, items!inner(language_code)").eq("user_id", userId).eq("items.language_code", code),
  ]);
  return {
    sections: (sections.data ?? []) as SectionRow[],
    lessons: (lessons.data ?? []) as LessonRow[],
    phrasePacks: (packs.data ?? []) as PhrasePackRow[],
    dialogues: (dialogues.data ?? []) as Pick<DialogueRow, "id" | "level" | "icon" | "title" | "situation" | "sort_order">[],
    culture: (culture.data ?? []) as NoteRow[],
    progress: new Map(
      (progress.data ?? []).map((p) => [p.lesson_id as string, p as { best_score: number; completed_at: string | null }]),
    ),
    dueCount: due.count ?? 0,
    mistakeIds: (mistakes.data ?? []).map((m) => m.item_id as string),
  };
}
