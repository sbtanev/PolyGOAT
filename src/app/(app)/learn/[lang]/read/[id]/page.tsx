import { notFound } from "next/navigation";
import { Reader } from "./Reader";
import { getDictionary } from "@/lib/i18n";
import { getItems, requireEnrollment, tr, type ReadingRow } from "@/lib/learn";
import { createClient } from "@/lib/supabase/server";

export default async function ReadPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  const { source } = await requireEnrollment(lang);
  const { t } = await getDictionary();

  const supabase = await createClient();
  const { data } = await supabase.from("readings").select("*").eq("id", id).eq("language_code", lang).maybeSingle();
  if (!data) notFound();
  const reading = data as ReadingRow;

  // Resolve the glossary to the learner's language; item-linked words take the item's translation
  const linked = await getItems(
    [...new Set(Object.values(reading.glossary).map((g) => g.item).filter((x): x is string => Boolean(x)))],
  );
  const glossary: Record<string, { translation: string; itemId?: string; base?: string; audio?: string | null }> = {};
  for (const [word, g] of Object.entries(reading.glossary)) {
    const item = g.item ? linked.find((i) => i.id === g.item) : undefined;
    const translation = g.translations ? tr(g.translations, source) : item ? tr(item.translations, source) : "";
    glossary[word.toLowerCase()] = { translation, itemId: item?.id, base: item?.text, audio: item?.audio_url };
  }

  return (
    <Reader
      lang={lang}
      readingId={reading.id}
      title={tr(reading.title, source)}
      level={reading.level}
      sentences={reading.sentences.map((s) => ({ text: s.text, translation: tr(s.translations, source) }))}
      glossary={glossary}
      labels={{ ...t.reading, back: t.learn.back, speed: t.audio.speed }}
    />
  );
}
