import type { AuthoredExercise } from "./packs/types";
import { tr } from "./tr";
import type { ItemRow, NoteRow } from "./learn";

/** A ready-to-render step for the lesson player, already in the learner's source language. */
export type Step =
  | { kind: "grammar"; title: string; body: string }
  | { kind: "intro"; itemId: string; text: string; translation: string; native?: string; note?: string; audio?: string | null }
  | { kind: "mc_translation"; itemId: string; prompt: string; audio?: string | null; options: string[]; answer: string }
  | { kind: "mc_target"; itemId: string; prompt: string; options: string[]; answer: string; audio?: string | null }
  | { kind: "listen"; itemId: string; say: string; audio?: string | null; options: string[]; answer: string }
  | { kind: "type_target"; itemId: string; prompt: string; answer: string }
  | { kind: "fill"; itemId?: string; prompt: string; answer: string; alternatives: string[]; options?: string[]; hint?: string; explanation?: string }
  | { kind: "order"; itemId?: string; words: string[]; answer: string; translation: string }
  | { kind: "choose"; itemId?: string; prompt: string; target?: string; options: string[]; answer: string; explanation?: string };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickOptions(answer: string, candidates: string[], n = 4) {
  const others = shuffle([...new Set(candidates.filter((c) => c && c !== answer))]).slice(0, n - 1);
  return shuffle([answer, ...others]);
}

function wordCount(s: string) {
  return s.trim().split(/\s+/).length;
}

type BuildInput = {
  items: ItemRow[];
  pool: ItemRow[];
  source: string;
  grammar?: NoteRow[];
  authored?: AuthoredExercise[];
  withIntros: boolean;
};

export function buildSteps({ items, pool, source, grammar = [], authored = [], withIntros }: BuildInput): Step[] {
  const all = [...items, ...pool.filter((p) => !items.some((i) => i.id === p.id))];
  const translations = all.map((i) => tr(i.translations, source));
  const texts = all.map((i) => i.text);
  const steps: Step[] = grammar.map((g) => ({ kind: "grammar", title: tr(g.title, source), body: tr(g.body, source) }));

  // 1. Introduce words three at a time, each group followed by quick recognition checks
  if (withIntros) {
    for (let i = 0; i < items.length; i += 3) {
      const group = items.slice(i, i + 3);
      for (const it of group) {
        steps.push({
          kind: "intro",
          itemId: it.id,
          text: it.text,
          translation: tr(it.translations, source),
          native: it.native && it.native !== it.text ? it.native : undefined,
          note: tr(it.notes, source) || undefined,
          audio: it.audio_url,
        });
      }
      for (const it of shuffle(group)) {
        const answer = tr(it.translations, source);
        steps.push({
          kind: "mc_translation",
          itemId: it.id,
          prompt: it.text,
          audio: it.audio_url,
          answer,
          options: pickOptions(answer, translations),
        });
      }
    }
  }

  // 2. A mixed round: produce the word, recognise it by ear, or type it (one task per word, max 10)
  const mixed: Step[] = [];
  const MAX_MIXED = withIntros ? 10 : 15;
  shuffle(items)
    .slice(0, MAX_MIXED)
    .forEach((it, idx) => {
      const translation = tr(it.translations, source);
      if (!withIntros) {
        mixed.push({ kind: "mc_translation", itemId: it.id, prompt: it.text, audio: it.audio_url, answer: translation, options: pickOptions(translation, translations) });
      }
      const kind = idx % 3;
      if (kind === 2 && wordCount(it.text) <= 3 && !it.text.includes("…")) {
        mixed.push({ kind: "type_target", itemId: it.id, prompt: translation, answer: it.text });
      } else if (kind === 1) {
        mixed.push({ kind: "listen", itemId: it.id, say: it.text, audio: it.audio_url, answer: it.text, options: pickOptions(it.text, texts) });
      } else {
        mixed.push({ kind: "mc_target", itemId: it.id, prompt: translation, answer: it.text, options: pickOptions(it.text, texts), audio: it.audio_url });
      }
    });

  for (const ex of authored) {
    if (ex.type === "fill_blank") {
      mixed.push({
        kind: "fill",
        itemId: ex.itemId,
        prompt: ex.prompt,
        answer: ex.answer,
        alternatives: ex.alternatives ?? [],
        options: ex.options ? shuffle(ex.options) : undefined,
        hint: ex.hint ? tr(ex.hint as Record<string, string>, source) : undefined,
        explanation: ex.explanation ? tr(ex.explanation as Record<string, string>, source) : undefined,
      });
    } else if (ex.type === "order_words") {
      const words = ex.sentence.split(/\s+/);
      mixed.push({
        kind: "order",
        itemId: ex.itemId,
        words: words.length > 1 ? shuffleUntilDifferent(words) : words,
        answer: ex.sentence,
        translation: tr(ex.translation as Record<string, string>, source),
      });
    } else if (ex.type === "choose") {
      mixed.push({
        kind: "choose",
        itemId: ex.itemId,
        prompt: tr(ex.prompt as Record<string, string>, source),
        target: ex.target,
        options: shuffle(ex.options),
        answer: ex.answer,
        explanation: ex.explanation ? tr(ex.explanation as Record<string, string>, source) : undefined,
      });
    }
  }

  return [...steps, ...shuffle(mixed)];
}

function shuffleUntilDifferent(words: string[]) {
  for (let i = 0; i < 5; i++) {
    const s = shuffle(words);
    if (s.join(" ") !== words.join(" ")) return s;
  }
  return [...words].reverse();
}
