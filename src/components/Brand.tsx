import Link from "next/link";
import { Goat } from "./Goat";
import { setLocale } from "@/app/actions";
import type { Locale } from "@/lib/i18n";

export function Wordmark({ size = "md" }: { size?: "md" | "lg" }) {
  const text = size === "lg" ? "text-4xl sm:text-5xl" : "text-xl";
  return (
    <span className={`font-display font-extrabold tracking-tight ${text}`}>
      Poly<span className="text-gold">GOAT</span>
    </span>
  );
}

export function LogoLink({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2">
      <Goat size={36} />
      <Wordmark />
    </Link>
  );
}

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const next = locale === "bg" ? "en" : "bg";
  return (
    <form action={setLocale}>
      <input type="hidden" name="locale" value={next} />
      <button
        type="submit"
        className="chip min-h-9 px-3 hover:border-muted"
        aria-label={next === "bg" ? "Превключи на български" : "Switch to English"}
      >
        {next === "bg" ? "🇧🇬 BG" : "🇬🇧 EN"}
      </button>
    </form>
  );
}
