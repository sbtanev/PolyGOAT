import Link from "next/link";
import { Goat } from "@/components/Goat";
import { Markdownish } from "@/components/Markdownish";
import { fmt, getDictionary, pickName } from "@/lib/i18n";
import { JourneyMap } from "@/components/JourneyMap";
import { getCourse, getJourney, requireEnrollment, tr } from "@/lib/learn";
import { boundsFor } from "@/lib/mapBounds";

export default async function CoursePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const { profile, language, enrollment, source } = await requireEnrollment(lang);
  const { t, locale } = await getDictionary();
  const [course, places] = await Promise.all([getCourse(lang, profile.id), getJourney(lang, profile.id)]);
  const unlockedPlaces = places.filter((p) => p.unlocked).length;
  const mapConfig = (language as unknown as { map?: { bounds?: [[number, number], [number, number]] } }).map;
  const empty = course.lessons.length === 0 && course.phrasePacks.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <section className="card flex items-center gap-4">
        <Goat accessory={language.mascot_accessory} size={84} />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold">
            {language.flag} {pickName(language.name, locale)}
          </h1>
          <p className="text-sm text-muted">
            {t.home.level} {enrollment.level}
          </p>
        </div>
      </section>

      {empty && <p className="card text-muted">{t.learn.noContent}</p>}

      {places.length > 0 && (
        <Link href={`/learn/${lang}/map`} className="card block overflow-hidden p-0 transition hover:border-gold/60 sm:p-0">
          <JourneyMap
            bounds={boundsFor(mapConfig, places)}
            accessory={language.mascot_accessory}
            height={420}
            highlight={[...new Set(places.map((p) => p.country).filter((c): c is string => Boolean(c)))]}
            stops={places.map((p) => ({ id: p.id, name: p.name, lat: p.lat, lng: p.lng, unlocked: p.unlocked }))}
          />
          <div className="flex items-center justify-between px-5 py-3">
            <span className="font-bold">🗺️ {t.map.title}</span>
            <span className="text-sm text-muted">{fmt(t.map.unlocked, { n: unlockedPlaces, total: places.length })} →</span>
          </div>
        </Link>
      )}

      {/* Review + practice + notebook */}
      <section className="grid gap-3 sm:grid-cols-3">
        <Link
          href={`/learn/${lang}/review`}
          className={`card flex flex-col gap-1 transition hover:border-muted ${course.dueCount ? "border-gold/60" : ""}`}
        >
          <span className="text-2xl">🔁</span>
          <span className="font-bold">{t.learn.review}</span>
          <span className="text-sm text-muted">
            {course.dueCount ? fmt(t.learn.reviewDue, { n: course.dueCount }) : t.learn.nothingDue}
          </span>
        </Link>
        {course.mistakeIds.length > 0 && (
          <Link href={`/learn/${lang}/practice`} className="card flex flex-col gap-1 transition hover:border-muted">
            <span className="text-2xl">🎯</span>
            <span className="font-bold">{t.learn.practice}</span>
            <span className="text-sm text-muted">{fmt(t.learn.practiceDesc, { n: course.mistakeIds.length })}</span>
          </Link>
        )}
        <Link href={`/learn/${lang}/notebook`} className="card flex flex-col gap-1 transition hover:border-muted">
          <span className="text-2xl">📓</span>
          <span className="font-bold">{t.learn.notebook}</span>
        </Link>
      </section>

      {/* Lessons by section */}
      {course.sections.map((section) => {
        const lessons = course.lessons.filter((l) => l.section_id === section.id);
        if (!lessons.length) return null;
        return (
          <section key={section.id}>
            <h2 className="mb-3 font-display text-lg font-bold">
              {tr(section.title, source)} <span className="text-sm font-normal text-muted">· {t.learn.lessons}</span>
            </h2>
            <ol className="flex flex-col gap-2">
              {lessons.map((lesson, i) => {
                const p = course.progress.get(lesson.id);
                return (
                  <li key={lesson.id}>
                    <Link
                      href={`/learn/${lang}/lesson/${lesson.id}`}
                      className="card flex items-center gap-4 p-4 transition hover:border-muted sm:p-4"
                    >
                      <span
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-display font-bold ${
                          p?.completed_at ? "bg-gold text-night" : "bg-panel-2 text-muted"
                        }`}
                      >
                        {p?.completed_at ? "✓" : i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold">{tr(lesson.title, source)}</span>
                        <span className="block truncate text-sm text-muted">
                          {tr(lesson.description, source)} · {fmt(t.learn.words, { n: lesson.item_ids.length })}
                        </span>
                      </span>
                      <span className="chip">{p ? fmt(t.learn.best, { n: p.best_score }) : t.learn.start}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}

      {course.phrasePacks.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg font-bold">{t.learn.phrasePacks}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {course.phrasePacks.map((pp) => (
              <li key={pp.id}>
                <Link href={`/learn/${lang}/phrases/${pp.id}`} className="card flex items-center gap-4 p-4 transition hover:border-muted sm:p-4">
                  <span className="text-3xl">{pp.icon ?? "💬"}</span>
                  <span>
                    <span className="block font-bold">{tr(pp.title, source)}</span>
                    <span className="block text-sm text-muted">{tr(pp.description, source)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {course.dialogues.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg font-bold">{t.learn.dialogues}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {course.dialogues.map((d) => (
              <li key={d.id}>
                <Link href={`/learn/${lang}/dialogue/${d.id}`} className="card flex items-center gap-4 p-4 transition hover:border-muted sm:p-4">
                  <span className="text-3xl">{d.icon ?? "🗨️"}</span>
                  <span>
                    <span className="block font-bold">{tr(d.title, source)}</span>
                    <span className="block text-sm text-muted">{tr(d.situation, source)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {course.readings.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg font-bold">{t.reading.title}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {course.readings.map((r) => (
              <li key={r.id}>
                <Link href={`/learn/${lang}/read/${r.id}`} className="card flex items-center gap-4 p-4 transition hover:border-muted sm:p-4">
                  <span className="text-3xl">📖</span>
                  <span>
                    <span className="block font-bold">{tr(r.title, source)}</span>
                    <span className="chip mt-1">{r.level}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {course.culture.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg font-bold">{t.learn.culture}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {course.culture.map((c) => (
              <details key={c.id} className="card">
                <summary className="cursor-pointer font-bold">🌍 {tr(c.title, source)}</summary>
                <Markdownish text={tr(c.body, source)} className="text-sm text-muted" />
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
