import Link from "next/link";
import { redirect } from "next/navigation";
import { Goat } from "@/components/Goat";
import { LocaleSwitcher, LogoLink, Wordmark } from "@/components/Brand";
import { getDictionary } from "@/lib/i18n";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function Landing() {
  const { t, locale } = await getDictionary();

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/home");
  }

  const route = [
    { accessory: "sombrero", label: "Madrid" },
    { accessory: "beanie", label: "Helsinki" },
    { accessory: "beret", label: "Paris" },
    { accessory: "laurel", label: "Roma" },
  ] as const;

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col px-4 py-5">
      <header className="flex items-center justify-between">
        <LogoLink />
        <LocaleSwitcher locale={locale} />
      </header>

      <section className="grid flex-1 items-center gap-10 py-10 md:grid-cols-[1.1fr_1fr]">
        <div>
          <Wordmark size="lg" />
          <h1 className="mt-5 font-display text-2xl font-bold leading-tight sm:text-3xl">
            {t.landing.title}
          </h1>
          <p className="mt-4 max-w-prose text-lg text-muted">{t.landing.subtitle}</p>

          {isSupabaseConfigured ? (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="btn-primary">
                {t.landing.join}
              </Link>
              <Link href="/login" className="btn-ghost">
                {t.landing.signIn}
              </Link>
            </div>
          ) : (
            <p className="mt-8 rounded-2xl border border-gold/40 bg-gold/10 p-4 text-sm">
              {t.landing.notConfigured}
            </p>
          )}
        </div>

        {/* The climb: the mascot in each language's hat, stepping up the mountain */}
        <div className="card relative overflow-hidden">
          <svg viewBox="0 0 400 260" className="absolute inset-0 h-full w-full" aria-hidden>
            <path d="M0 260 L120 120 L190 180 L290 50 L400 200 L400 260 Z" fill="#29233f" />
            <path d="M290 50 L262 87 L280 80 L292 92 L306 74 L318 83 Z" fill="#f6f1e7" opacity=".85" />
            <path
              d="M30 235 C90 215 110 175 160 170 S240 140 260 110 S300 70 300 55"
              stroke="#f2c84b"
              strokeWidth="3"
              strokeDasharray="2 10"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          <ol className="relative grid grid-cols-2 gap-4 py-2">
            {route.map((stop, i) => (
              <li key={stop.label} className="flex flex-col items-center" style={{ marginTop: (3 - i) * 14 }}>
                <Goat accessory={stop.accessory} size={78} />
                <span className="chip mt-1">{stop.label}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="grid gap-4 pb-6 sm:grid-cols-3">
        {t.landing.features.map(([title, body]) => (
          <div key={title} className="card">
            <h2 className="font-display text-base font-bold">{title}</h2>
            <p className="mt-2 text-sm text-muted">{body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
