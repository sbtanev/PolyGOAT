import { notFound } from "next/navigation";
import { DialoguePlayer } from "./DialoguePlayer";
import { getDictionary } from "@/lib/i18n";
import { requireEnrollment, tr, type DialogueRow } from "@/lib/learn";
import { createClient } from "@/lib/supabase/server";

export default async function DialoguePage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  const { language, source } = await requireEnrollment(lang);
  const { t } = await getDictionary();

  const supabase = await createClient();
  const { data } = await supabase.from("dialogues").select("*").eq("id", id).eq("language_code", lang).maybeSingle();
  if (!data) notFound();
  const d = data as DialogueRow;

  // Resolve everything to the learner's source language on the server
  const lines = d.lines.map((l) => ({
    speaker: l.speaker,
    text: l.text,
    translation: tr(l.translations, source),
    choices: l.choices?.map((c) => ({
      text: c.text,
      translation: tr(c.translations, source),
      correct: c.correct,
      feedback: c.feedback ? tr(c.feedback, source) : undefined,
    })),
  }));

  return (
    <DialoguePlayer
      id={d.id}
      lang={lang}
      title={tr(d.title, source)}
      situation={tr(d.situation, source)}
      icon={d.icon}
      speakers={d.speakers}
      lines={lines}
      learnerAccessory={language.mascot_accessory}
      labels={{ ...t.dialogue, back: t.learn.back, speed: t.audio.speed }}
    />
  );
}
