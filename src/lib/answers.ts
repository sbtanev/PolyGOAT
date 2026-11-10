/** Lowercase, drop punctuation (incl. ¿ ¡) and squeeze spaces. */
export function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[.,!?¿¡;:"“”«»()…]/g, " ")
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function stripAccents(s: string) {
  return s.normalize("NFD").replace(/\p{M}/gu, "");
}

export type Verdict = "correct" | "almost" | "wrong";

/**
 * "almost" = right except for accents/diacritics (e.g. "adios" for "adiós").
 * It still counts as correct, but the learner sees the proper spelling.
 */
export function checkAnswer(given: string, answers: string[]): Verdict {
  const g = normalize(given);
  if (!g) return "wrong";
  if (answers.some((a) => normalize(a) === g)) return "correct";
  if (answers.some((a) => stripAccents(normalize(a)) === stripAccents(g))) return "almost";
  return "wrong";
}
