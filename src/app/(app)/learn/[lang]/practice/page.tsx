import { redirect } from "next/navigation";
import { LessonPlayer } from "../LessonPlayer";
import { buildSteps } from "@/lib/exercises";
import { getDictionary, pickName } from "@/lib/i18n";
import { getDistractorPool, getItems, requireEnrollment } from "@/lib/learn";
import { createClient } from "@/lib/supabase/server";

/** "Mistakes become exercises": a lesson built from the words this user got wrong. */
export default async function PracticePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const { profile, language, source } = await requireEnrollment(lang);
  const { t, locale } = await getDictionary();

  const supabase = await createClient();
  const { data } = await supabase
    .from("mistakes")
    .select("item_id, count, items!inner(language_code)")
    .eq("user_id", profile.id)
    .eq("items.language_code", lang)
    .order("count", { ascending: false })
    .limit(10);
  const ids = (data ?? []).map((m) => m.item_id as string);
  if (!ids.length) redirect(`/learn/${lang}`);

  const [items, pool] = await Promise.all([getItems(ids), getDistractorPool(lang)]);
  const steps = buildSteps({ items, pool, source, withIntros: false });

  return (
    <LessonPlayer
      steps={steps}
      lang={lang}
      accessory={language.mascot_accessory}
      labels={{ ...t.player, speed: t.audio.speed, langName: pickName(language.name, locale) }}
    />
  );
}
