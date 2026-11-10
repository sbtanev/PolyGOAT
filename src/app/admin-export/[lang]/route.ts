import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { LanguagePack } from "@/lib/packs/types";

type Row = Record<string, unknown>;
const clean = <T extends Row>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0))) as T;

/** Admin-only: download a language's content from the database in the language-pack format. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return new NextResponse("Forbidden", { status: 403 });

  const q = (table: string) => supabase.from(table).select("*").eq("language_code", lang).order("sort_order");
  const [{ data: language }, sections, { data: items }, grammar, culture, lessons, packs, dialogues, readings, places] =
    await Promise.all([
      supabase.from("languages").select("*").eq("code", lang).single(),
      q("sections"),
      supabase.from("items").select("*").eq("language_code", lang).order("frequency_rank", { nullsFirst: false }),
      q("grammar_notes"),
      q("culture_notes"),
      q("lessons"),
      q("phrase_packs"),
      q("dialogues"),
      q("readings"),
      q("map_places"),
    ]);
  if (!language) return new NextResponse("Not found", { status: 404 });

  const slug = (sectionId: unknown) => (typeof sectionId === "string" ? sectionId.replace(`${lang}-`, "") : undefined);
  const rows = (r: { data: Row[] | null }) => r.data ?? [];

  const pack: LanguagePack = {
    version: String(language.pack_version ?? "0.0.0") + "-export",
    language: clean({
      code: language.code,
      name: language.name,
      nativeName: language.native_name,
      flag: language.flag,
      script: language.script,
      features: language.features,
      mascotAccessory: language.mascot_accessory,
      varieties: language.varieties,
      ttsLocale: language.tts_locale,
      active: language.is_active,
      mapBounds: language.map?.bounds,
    }),
    sections: rows(sections).map((s) => clean({ slug: s.slug, title: s.title, description: s.description, unlockAfterLevel: s.unlock_after_level })) as LanguagePack["sections"],
    items: (items ?? []).map((i) =>
      clean({
        id: i.id, text: i.text, kind: i.kind, translations: i.translations, translationStatus: i.translation_status,
        pos: i.pos, gender: i.gender, frequencyRank: i.frequency_rank, native: i.native, slang: i.slang,
        notes: i.notes, extras: i.extras, audio: i.audio_url,
      }),
    ),
    grammarNotes: rows(grammar).map((g) => clean({ id: g.id, level: g.level, title: g.title, body: g.body })) as LanguagePack["grammarNotes"],
    cultureNotes: rows(culture).map((c) => clean({ id: c.id, title: c.title, body: c.body })) as LanguagePack["cultureNotes"],
    lessons: rows(lessons).map((l) =>
      clean({ id: l.id, section: slug(l.section_id), level: l.level, title: l.title, description: l.description, items: l.item_ids, grammar: l.grammar_ids, exercises: l.exercises }),
    ) as LanguagePack["lessons"],
    phrasePacks: rows(packs).map((p) => clean({ id: p.id, level: p.level, icon: p.icon, title: p.title, description: p.description, items: p.item_ids })) as LanguagePack["phrasePacks"],
    dialogues: rows(dialogues).map((d) => clean({ id: d.id, level: d.level, icon: d.icon, title: d.title, situation: d.situation, speakers: d.speakers, lines: d.lines })) as LanguagePack["dialogues"],
    readings: rows(readings).map((r) => clean({ id: r.id, section: slug(r.section_id), level: r.level, title: r.title, sentences: r.sentences, glossary: r.glossary })) as LanguagePack["readings"],
    places: rows(places).map((p) =>
      clean({
        id: p.id, section: slug(p.section_id), name: p.name, country: p.country, lat: p.lat, lng: p.lng, description: p.description,
        unlockAfterLesson: p.unlock_after_lesson, localItems: p.local_item_ids, cultureNote: p.culture_note_id, reading: p.reading_id,
      }),
    ) as LanguagePack["places"],
  };

  return new NextResponse(JSON.stringify(pack, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${lang}.json"`,
    },
  });
}
