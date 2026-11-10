import "server-only";
import { cookies, headers } from "next/headers";
import en, { type Dictionary } from "./en";
import bg from "./bg";

export const LOCALES = ["en", "bg"] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_COOKIE = "locale";

const dictionaries: Record<Locale, Dictionary> = { en, bg };

export async function getLocale(): Promise<Locale> {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (fromCookie === "en" || fromCookie === "bg") return fromCookie;
  const accept = (await headers()).get("accept-language") ?? "";
  return accept.toLowerCase().startsWith("bg") ? "bg" : "en";
}

export async function getDictionary() {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}

/** Replace {placeholders} in a dictionary string. */
export function fmt(text: string, values: Record<string, string | number>) {
  return text.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));
}

/** Pick the right translation from a {"en": ..., "bg": ...} object. */
export function pickName(name: Record<string, string> | null | undefined, locale: Locale) {
  if (!name) return "";
  return name[locale] ?? name.en ?? Object.values(name)[0] ?? "";
}

export type { Dictionary };
