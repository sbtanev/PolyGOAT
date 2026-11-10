import { notFound } from "next/navigation";
import { LessonPlayer } from "../../LessonPlayer";
import { buildSteps } from "@/lib/exercises";
import { getDictionary, pickName } from "@/lib/i18n";
import { getDistractorPool, getItems, requireEnrollment, type LessonRow, type NoteRow } from "@/lib/learn";
import type { AuthoredExercise } from "@/lib/packs/types";
import { createClient } from "@/lib/supabase/server";

export default async function LessonPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  const { language, source } = await requireEnrollment(lang);
  const { t, locale } = await getDictionary();

  const supabase = await createClient();
  const { data } = await supabase.from("lessons").select("*").eq("id", id).eq("language_code", lang).maybeSingle();
  if (!data) notFound();
  const lesson = data as LessonRow;

  const [items, pool, grammar] = await Promise.all([
    getItems(lesson.item_ids),
    getDistractorPool(lang),
    lesson.grammar_ids.length
      ? supabase.from("grammar_notes").select("*").in("id", lesson.grammar_ids).then((r) => (r.data ?? []) as NoteRow[])
      : Promise.resolve([] as NoteRow[]),
  ]);

  const steps = buildSteps({
    items,
    pool,
    source,
    grammar,
    authored: lesson.exercises as AuthoredExercise[],
    withIntros: true,
  });

  return (
    <LessonPlayer
      steps={steps}
      lang={lang}
      lessonId={lesson.id}
      accessory={language.mascot_accessory}
      labels={{ ...t.player, speed: t.audio.speed, langName: pickName(language.name, locale) }}
    />
  );
}
