import Link from "next/link";
import { notFound } from "next/navigation";
import { SpeakButton, SpeedToggle } from "@/components/Speak";
import { AddToReviewButton } from "./AddToReviewButton";
import { getDictionary } from "@/lib/i18n";
import { getItems, requireEnrollment, tr, type PhrasePackRow } from "@/lib/learn";
import { createClient } from "@/lib/supabase/server";

const VARIETY_FLAGS: Record<string, string> = {
  "es-ES": "🇪🇸", "es-MX": "🇲🇽", "es-AR": "🇦🇷", "es-CO": "🇨🇴", "es-CL": "🇨🇱", "es-PE": "🇵🇪", "es-CU": "🇨🇺",
  "fr-FR": "🇫🇷", "fr-CA": "🇨🇦", "fr-BE": "🇧🇪", "fr-CH": "🇨🇭",
  "de-DE": "🇩🇪", "de-AT": "🇦🇹", "de-CH": "🇨🇭",
};

export default async function PhrasePackPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  const { profile, source } = await requireEnrollment(lang);
  const { t } = await getDictionary();

  const supabase = await createClient();
  const { data } = await supabase.from("phrase_packs").select("*").eq("id", id).eq("language_code", lang).maybeSingle();
  if (!data) notFound();
  const pack = data as PhrasePackRow;
  const items = await getItems(pack.item_ids);
  const { data: cards } = await supabase
    .from("review_cards")
    .select("item_id")
    .eq("user_id", profile.id)
    .in("item_id", pack.item_ids);
  const allAdded = (cards ?? []).length >= items.length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/learn/${lang}`} className="text-sm text-muted hover:text-ink">
          ← {t.learn.back}
        </Link>
        <SpeedToggle label={t.audio.speed} />
      </div>
      <header className="card flex items-center gap-4">
        <span className="text-5xl">{pack.icon ?? "💬"}</span>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold sm:text-2xl">{tr(pack.title, source)}</h1>
          <p className="text-muted">{tr(pack.description, source)}</p>
        </div>
      </header>

      <ul className="flex flex-col gap-3">
        {items.map((it) => (
          <li key={it.id} className="card flex flex-col gap-3 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <SpeakButton text={it.text} audio={it.audio_url} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">{t.phrases.textbook}</p>
                <p className="font-display text-lg font-bold">{it.text}</p>
                {typeof it.extras?.translit === "string" && <p className="text-sm italic text-mint">{it.extras.translit}</p>}
                <p className="text-muted">{tr(it.translations, source)}</p>
              </div>
            </div>
            {it.native && it.native !== it.text && (
              <div className="flex items-center gap-3 rounded-2xl bg-mint/10 px-4 py-3">
                <SpeakButton text={it.native} size="sm" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-mint">🗣️ {t.phrases.native}</p>
                  <p className="font-bold">{it.native}</p>
                </div>
              </div>
            )}
            {Object.keys(it.slang ?? {}).length > 0 && (
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-gold">🌶️ {t.phrases.slang}</p>
                <ul className="flex flex-wrap gap-2">
                  {Object.entries(it.slang).map(([variety, text]) => (
                    <li key={variety} className="chip text-sm">
                      {VARIETY_FLAGS[variety] ?? variety} {text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {tr(it.notes, source) && <p className="text-sm text-muted">💡 {tr(it.notes, source)}</p>}
          </li>
        ))}
      </ul>

      <AddToReviewButton
        lang={lang}
        itemIds={pack.item_ids}
        initiallyAdded={allAdded}
        labels={{ add: t.phrases.addAll, added: t.phrases.added }}
      />
    </div>
  );
}
