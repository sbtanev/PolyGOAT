"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/data";
import { cardToRow, newCard, Rating, rowToCard, scheduler, type CardRow } from "@/lib/srs";
import { awardXp, XP } from "@/lib/xp";

type Result = { itemId?: string; correct: boolean };

export async function finishSession(input: {
  lang: string;
  lessonId?: string;
  results: Result[];
  correct: number;
  total: number;
}) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const score = input.total ? Math.round((input.correct / input.total) * 100) : 0;

  if (input.lessonId) {
    const { data: prev } = await supabase
      .from("lesson_progress")
      .select("*")
      .eq("user_id", profile.id)
      .eq("lesson_id", input.lessonId)
      .maybeSingle();
    await supabase.from("lesson_progress").upsert({
      user_id: profile.id,
      lesson_id: input.lessonId,
      attempts: (prev?.attempts ?? 0) + 1,
      best_score: Math.max(prev?.best_score ?? 0, score),
      completed_at: prev?.completed_at ?? new Date().toISOString(),
    });
  }

  if (input.lessonId) {
    await awardXp(supabase, profile.id, XP.lesson + (score >= 90 ? XP.lessonPerfectBonus : 0), "lesson", input.lang, input.lessonId);
  } else if (input.total > 0) {
    await awardXp(supabase, profile.id, XP.practice, "practice", input.lang);
  }

  // Per item: wrong at least once → mistake; otherwise right
  const perItem = new Map<string, boolean>();
  for (const r of input.results) if (r.itemId) perItem.set(r.itemId, (perItem.get(r.itemId) ?? true) && r.correct);
  const wrong = [...perItem].filter(([, ok]) => !ok).map(([id]) => id);
  const right = [...perItem].filter(([, ok]) => ok).map(([id]) => id);
  if (perItem.size) await supabase.rpc("record_mistakes", { p_wrong: wrong, p_right: right });

  // Put lesson words into the review queue: easy ones a bit later, missed ones soon
  if (input.lessonId && perItem.size) {
    const { data: existing } = await supabase
      .from("review_cards")
      .select("item_id")
      .eq("user_id", profile.id)
      .in("item_id", [...perItem.keys()]);
    const have = new Set((existing ?? []).map((e) => e.item_id));
    const rows = [...perItem]
      .filter(([id]) => !have.has(id))
      .map(([id, ok]) => ({
        user_id: profile.id,
        language_code: input.lang,
        item_id: id,
        ...cardToRow(newCard(ok ? Rating.Good : Rating.Again)),
      }));
    if (rows.length) await supabase.from("review_cards").insert(rows);
  }

  revalidatePath(`/learn/${input.lang}`);
  return { score };
}

export async function addItemsToReview(lang: string, itemIds: string[]) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const rows = itemIds.map((id) => ({ user_id: profile.id, language_code: lang, item_id: id, ...cardToRow(newCard()) }));
  await supabase.from("review_cards").upsert(rows, { onConflict: "user_id,item_id", ignoreDuplicates: true });
  revalidatePath(`/learn/${lang}`);
}

export async function rateCard(cardId: number, grade: 1 | 2 | 3 | 4) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("review_cards")
    .select("*")
    .eq("id", cardId)
    .eq("user_id", profile.id)
    .maybeSingle();
  if (!data) return;
  const row = data as CardRow;
  const { card } = scheduler.next(rowToCard(row), new Date(), grade);
  await supabase.from("review_cards").update(cardToRow(card)).eq("id", cardId);
  await supabase.from("review_log").insert({ user_id: profile.id, card_id: cardId, rating: grade, state: row.state });
  await awardXp(supabase, profile.id, XP.review, "review", row.language_code);
}

export async function completeDialogue(lang: string, dialogueId: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  await awardXp(supabase, profile.id, XP.dialogue, "dialogue", lang, dialogueId);
}

export async function completeReading(lang: string, readingId: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  await awardXp(supabase, profile.id, XP.reading, "reading", lang, readingId);
  revalidatePath(`/learn/${lang}`);
}

/** Click-to-translate in readings: save a word that isn't a course item into the notebook. */
export async function saveWordToNotebook(lang: string, text: string, translation: string, sentence: string) {
  const fd = new FormData();
  fd.set("text", text);
  fd.set("translation", translation);
  fd.set("context_sentence", sentence);
  await addNotebookEntry(lang, fd);
}

export async function addNotebookEntry(lang: string, formData: FormData) {
  const profile = await requireProfile();
  const text = String(formData.get("text") ?? "").trim().slice(0, 200);
  const translation = String(formData.get("translation") ?? "").trim().slice(0, 200);
  const context = String(formData.get("context_sentence") ?? "").trim().slice(0, 500) || null;
  const note = String(formData.get("note") ?? "").trim().slice(0, 500) || null;
  if (!text || !translation) return;

  const supabase = await createClient();
  const { data: entry } = await supabase
    .from("notebook_entries")
    .insert({ user_id: profile.id, language_code: lang, text, translation, context_sentence: context, note })
    .select("id")
    .single();
  if (entry) {
    await supabase
      .from("review_cards")
      .insert({ user_id: profile.id, language_code: lang, note_id: entry.id, ...cardToRow(newCard()) });
  }
  revalidatePath(`/learn/${lang}/notebook`);
}

export async function deleteNotebookEntry(lang: string, formData: FormData) {
  const profile = await requireProfile();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("notebook_entries").delete().eq("id", id).eq("user_id", profile.id);
  revalidatePath(`/learn/${lang}/notebook`);
}
