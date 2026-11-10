import { ReviewSession, type ReviewCard } from "./ReviewSession";
import { getDictionary } from "@/lib/i18n";
import { requireEnrollment, tr, type ItemRow } from "@/lib/learn";
import { createClient } from "@/lib/supabase/server";

type Row = {
  id: number;
  item_id: string | null;
  note_id: string | null;
  items: ItemRow | null;
  notebook_entries: { text: string; translation: string; context_sentence: string | null; note: string | null } | null;
};

export default async function ReviewPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const { profile, source } = await requireEnrollment(lang);
  const { t } = await getDictionary();

  const supabase = await createClient();
  const { data } = await supabase
    .from("review_cards")
    .select("id, item_id, note_id, items(*), notebook_entries(text, translation, context_sentence, note)")
    .eq("user_id", profile.id)
    .eq("language_code", lang)
    .lte("due", new Date().toISOString())
    .order("due")
    .limit(50);

  const cards: ReviewCard[] = ((data ?? []) as unknown as Row[]).flatMap((r): ReviewCard[] => {
    if (r.items) {
      return [{
        id: r.id,
        front: r.items.text,
        back: tr(r.items.translations, source),
        extra: r.items.native && r.items.native !== r.items.text ? `🗣️ ${r.items.native}` : tr(r.items.notes, source) || undefined,
        audio: r.items.audio_url,
        fromNotebook: false,
      }];
    }
    if (r.notebook_entries) {
      const n = r.notebook_entries;
      return [{
        id: r.id,
        front: n.text,
        back: n.translation,
        extra: [n.context_sentence && `“${n.context_sentence}”`, n.note].filter(Boolean).join(" · ") || undefined,
        audio: null,
        fromNotebook: true,
      }];
    }
    return [];
  });

  return (
    <ReviewSession
      lang={lang}
      cards={cards}
      labels={{ ...t.review, back: t.learn.back, speed: t.audio.speed, nothingDue: t.learn.nothingDue }}
    />
  );
}
