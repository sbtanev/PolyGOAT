import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Goat } from "@/components/Goat";
import { fmt, getDictionary, pickName } from "@/lib/i18n";
import { getBaseLanguages, getLanguages, getUserLanguages, requireProfile } from "@/lib/data";

export const metadata: Metadata = { title: "Home" };

export default async function HomePage() {
  const profile = await requireProfile();
  const { t, locale } = await getDictionary();
  const [mine, languages, bases] = await Promise.all([
    getUserLanguages(profile.id),
    getLanguages(),
    getBaseLanguages(),
  ]);
  if (mine.length === 0) redirect("/onboarding");

  return (
    <div className="flex flex-col gap-6">
      <section className="card flex items-center gap-4">
        <Goat accessory="crown" size={84} />
        <div>
          <h1 className="font-display text-xl font-bold sm:text-2xl">
            {fmt(t.home.greeting, { name: profile.display_name })}
          </h1>
          <p className="mt-1 text-muted">{t.home.motivation}</p>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">{t.home.yourLanguages}</h2>
          <Link href="/onboarding" className="chip min-h-9 px-3 hover:border-muted">
            + {t.nav.addLanguage}
          </Link>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {mine.map((ul) => {
            const lang = languages.find((l) => l.code === ul.language_code);
            const base = bases.find((b) => b.code === ul.source_language);
            if (!lang) return null;
            return (
              <li key={ul.language_code}>
                <Link href={`/learn/${ul.language_code}`} className="card flex items-center gap-4 transition hover:border-gold/60">
                <Goat accessory={lang.mascot_accessory} size={72} />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-bold">
                    {lang.flag} {pickName(lang.name, locale)}
                  </p>
                  <p className="text-sm text-muted">
                    {t.home.level} {ul.level} · {t.home.from} {base?.flag} {pickName(base?.name, locale)}
                  </p>
                  <p className="mt-2 text-sm font-bold text-gold">{t.learn.continue} →</p>
                </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
