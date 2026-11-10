import Link from "next/link";
import { JourneyMap } from "@/components/JourneyMap";
import { fmt, getDictionary } from "@/lib/i18n";
import { getJourney, requireEnrollment, tr } from "@/lib/learn";
import { boundsFor } from "@/lib/mapBounds";

export default async function MapPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const { profile, language, source } = await requireEnrollment(lang);
  const { t } = await getDictionary();
  const places = await getJourney(lang, profile.id);
  const unlocked = places.filter((p) => p.unlocked).length;
  const mapConfig = (language as unknown as { map?: { bounds?: [[number, number], [number, number]] } }).map;

  return (
    <div className="flex flex-col gap-5">
      <Link href={`/learn/${lang}`} className="text-sm text-muted hover:text-ink">
        ← {t.learn.back}
      </Link>
      <header className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="font-display text-xl font-bold sm:text-2xl">
          🗺️ {t.map.title} · {language.flag}
        </h1>
        <span className="chip">{fmt(t.map.unlocked, { n: unlocked, total: places.length })}</span>
      </header>

      {places.length === 0 ? (
        <p className="card text-muted">{t.learn.noContent}</p>
      ) : (
        <>
          <JourneyMap
            bounds={boundsFor(mapConfig, places)}
            accessory={language.mascot_accessory}
            highlight={[...new Set(places.map((p) => p.country).filter((c): c is string => Boolean(c)))]}
            stops={places.map((p) => ({
              id: p.id,
              name: p.name,
              lat: p.lat,
              lng: p.lng,
              unlocked: p.unlocked,
              href: p.unlocked ? `/learn/${lang}/place/${p.id}` : undefined,
            }))}
          />
          <ol className="grid gap-2 sm:grid-cols-2">
            {places.map((p, i) => (
              <li key={p.id}>
                {p.unlocked ? (
                  <Link href={`/learn/${lang}/place/${p.id}`} className="card flex items-center gap-3 p-4 transition hover:border-muted sm:p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold font-display font-bold text-night">
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-bold">{p.name}</span>
                      <span className="block truncate text-sm text-muted">{tr(p.description, source)}</span>
                    </span>
                  </Link>
                ) : (
                  <div className="card flex items-center gap-3 p-4 opacity-60 sm:p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-panel-2">🔒</span>
                    <span className="min-w-0">
                      <span className="block font-bold">{p.name}</span>
                      <span className="block text-sm text-muted">
                        {fmt(t.map.unlockHint, { lesson: tr(p.lessonTitle, source) })}
                      </span>
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
