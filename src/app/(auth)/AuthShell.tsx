import { Goat } from "@/components/Goat";
import { LocaleSwitcher, LogoLink } from "@/components/Brand";
import type { Locale } from "@/lib/i18n";

export function AuthShell({
  title,
  locale,
  accessory,
  children,
}: {
  title: string;
  locale: Locale;
  accessory?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-5">
      <header className="flex items-center justify-between">
        <LogoLink />
        <LocaleSwitcher locale={locale} />
      </header>
      <div className="flex flex-1 flex-col justify-center py-8">
        <div className="mb-[-14px] flex justify-center">
          <Goat accessory={accessory} size={92} />
        </div>
        <section className="card">
          <h1 className="mb-5 text-center font-display text-xl font-bold">{title}</h1>
          {children}
        </section>
      </div>
    </main>
  );
}
