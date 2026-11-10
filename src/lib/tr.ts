export type Tr = Record<string, string>;

/** Translation in the given language, falling back to English, then to anything. */
export function tr(obj: Tr | null | undefined, lang: string) {
  if (!obj) return "";
  return obj[lang] ?? obj.en ?? Object.values(obj)[0] ?? "";
}
