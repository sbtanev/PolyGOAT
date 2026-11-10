import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Goat } from "@/components/Goat";
import { Markdownish } from "@/components/Markdownish";
import { SpeakButton, SpeedToggle } from "@/components/Speak";
import { AddToReviewButton } from "../../phrases/[id]/AddToReviewButton";
import { getDictionary } from "@/lib/i18n";
import { getItems, getJourney, requireEnrollment, tr, type NoteRow } from "@/lib/learn";
import { createClient } from "@/lib/supabase/server";

export default async function PlacePage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  const { profile, language, source } = await requireEnrollment(lang);
  const { t } = await getDictionary();
  const places = await getJourney(lang, profile.id);
  const place = places.find((p) => p.id === id);
  if (!place) notFound();
  if (!place.unlocked) redirect(`/learn/${lang}/map`);

  const supabase = await createClient();
  const [items, culture] = await Promise.all([
    getItems(place.local_item_ids),
    place.culture_note_id
      ? supabase.from("culture_notes").select("*").eq("id", place.culture_note_id).maybeSingle().then((r) => r.data as NoteRow | null)
      : Promise.resolve(null),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/learn/${lang}/map`} className="text-sm text-muted hover:text-ink">
          ← {t.map.title}
        </Link>
        <SpeedToggle label={t.audio.speed} />
      </div>
      <header className="card flex items-center gap-4">
        <Goat accessory={language.mascot_accessory} size={88} />
        <div>
          <p className="text-sm text-muted">📍 {t.map.youAreHere}</p>
          <h1 className="font-display text-2xl font-bold">{place.name}</h1>
          <p className="mt-1 text-muted">{tr(place.description, source)}</p>
        </div>
      </header>

      {items.length > 0 && (
        <section className="card flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold">🗣️ {t.map.localWords}</h2>
          <ul className="flex flex-col gap-2">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 rounded-2xl bg-panel-2 px-4 py-3">
                <SpeakButton text={it.text} audio={it.audio_url} size="sm" />
                <div className="min-w-0">
                  <p className="font-bold">
                    {it.text}
                    {typeof it.extras?.translit === "string" && <span className="ml-2 text-sm font-normal italic text-mint">{it.extras.translit}</span>}
                  </p>
                  <p className="text-sm text-muted">
                    {tr(it.translations, source)}
                    {tr(it.notes, source) && ` · ${tr(it.notes, source)}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <AddToReviewButton
            lang={lang}
            itemIds={place.local_item_ids}
            initiallyAdded={false}
            labels={{ add: t.phrases.addAll, added: t.phrases.added }}
          />
        </section>
      )}

      {culture && (
        <section className="card">
          <h2 className="font-display text-lg font-bold">🌍 {tr(culture.title, source)}</h2>
          <Markdownish text={tr(culture.body, source)} className="text-muted" />
        </section>
      )}

      {place.reading_id && (
        <Link href={`/learn/${lang}/read/${place.reading_id}`} className="btn-primary">
          📖 {t.map.readAbout}
        </Link>
      )}
    </div>
  );
}
