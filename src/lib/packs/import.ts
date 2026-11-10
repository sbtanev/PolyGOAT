import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LanguagePack } from "./types";
import { validatePack } from "./validate";

export type ImportResult = { ok: boolean; errors: string[]; counts: Record<string, number> };

/**
 * Writes a pack into the database (insert or update by id). Nothing is deleted,
 * so learners keep their progress when a pack is re-imported.
 */
export async function importPack(supabase: SupabaseClient, pack: LanguagePack): Promise<ImportResult> {
  const errors = validatePack(pack);
  if (errors.length) return { ok: false, errors, counts: {} };

  const lang = pack.language;
  const code = lang.code;
  const sectionId = (slug?: string) => `${code}-${slug ?? "core"}`;
  const counts: Record<string, number> = {};

  const steps: [string, string, Record<string, unknown>[]][] = [
    [
      "languages",
      "languages",
      [
        {
          code,
          name: lang.name,
          native_name: lang.nativeName,
          flag: lang.flag,
          script: lang.script ?? "latin",
          features: lang.features ?? [],
          mascot_accessory: lang.mascotAccessory ?? null,
          varieties: lang.varieties ?? [],
          tts_locale: lang.ttsLocale ?? null,
          is_active: lang.active ?? true,
          pack_version: pack.version,
        },
      ],
    ],
    [
      "sections",
      "sections",
      [{ slug: "core", title: { en: "Core course", bg: "Основен курс" } }, ...(pack.sections ?? [])]
        .filter((s, i, all) => all.findIndex((x) => x.slug === s.slug) === i)
        .map((s, i) => ({
          id: sectionId(s.slug),
          language_code: code,
          slug: s.slug,
          title: s.title,
          description: ("description" in s && s.description) || {},
          unlock_after_level: ("unlockAfterLevel" in s && s.unlockAfterLevel) || null,
          sort_order: i,
        })),
    ],
    [
      "items",
      "items",
      pack.items.map((it) => ({
        id: it.id,
        language_code: code,
        kind: it.kind ?? "word",
        text: it.text,
        translations: it.translations,
        translation_status: it.translationStatus ?? {},
        pos: it.pos ?? null,
        gender: it.gender ?? null,
        frequency_rank: it.frequencyRank ?? null,
        native: it.native ?? null,
        slang: it.slang ?? {},
        notes: it.notes ?? {},
        extras: it.extras ?? {},
        audio_url: it.audio ?? null,
      })),
    ],
    [
      "grammar",
      "grammar_notes",
      (pack.grammarNotes ?? []).map((g, i) => ({
        id: g.id,
        language_code: code,
        level: g.level ?? null,
        title: g.title,
        body: g.body,
        sort_order: i,
      })),
    ],
    [
      "culture",
      "culture_notes",
      (pack.cultureNotes ?? []).map((c, i) => ({ id: c.id, language_code: code, title: c.title, body: c.body, sort_order: i })),
    ],
    [
      "lessons",
      "lessons",
      pack.lessons.map((l, i) => ({
        id: l.id,
        language_code: code,
        section_id: sectionId(l.section),
        level: l.level ?? "A1",
        title: l.title,
        description: l.description ?? {},
        item_ids: l.items,
        grammar_ids: l.grammar ?? [],
        exercises: l.exercises ?? [],
        sort_order: i,
      })),
    ],
    [
      "phrasePacks",
      "phrase_packs",
      (pack.phrasePacks ?? []).map((p, i) => ({
        id: p.id,
        language_code: code,
        level: p.level ?? "A1",
        icon: p.icon ?? null,
        title: p.title,
        description: p.description ?? {},
        item_ids: p.items,
        sort_order: i,
      })),
    ],
    [
      "dialogues",
      "dialogues",
      (pack.dialogues ?? []).map((d, i) => ({
        id: d.id,
        language_code: code,
        level: d.level ?? "A1",
        icon: d.icon ?? null,
        title: d.title,
        situation: d.situation ?? {},
        speakers: d.speakers,
        lines: d.lines,
        sort_order: i,
      })),
    ],
  ];

  for (const [label, table, rows] of steps) {
    if (!rows.length) continue;
    const { error } = await supabase.from(table).upsert(rows);
    if (error) return { ok: false, errors: [`${table}: ${error.message}`], counts };
    counts[label] = rows.length;
  }
  return { ok: true, errors: [], counts };
}
