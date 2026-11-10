"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { SpeakButton, SpeedToggle, useSpeak } from "@/components/Speak";
import { addItemsToReview, completeReading, saveWordToNotebook } from "../../actions";

type Gloss = { translation: string; itemId?: string; base?: string; audio?: string | null };

type Labels = {
  tapWord: string;
  showAll: string;
  addReview: string;
  addNotebook: string;
  saved: string;
  noTranslation: string;
  finish: string;
  finished: string;
  back: string;
  speed: string;
};

// Split into words and the spaces/punctuation between them, keeping everything for display.
const TOKEN = /([\p{L}\p{M}'’-]+)/u;

export function Reader({
  lang,
  readingId,
  title,
  level,
  sentences,
  glossary,
  labels,
}: {
  lang: string;
  readingId: string;
  title: string;
  level: string;
  sentences: { text: string; translation: string }[];
  glossary: Record<string, Gloss>;
  labels: Labels;
}) {
  const speak = useSpeak();
  const [picked, setPicked] = useState<{ word: string; sentence: number } | null>(null);
  const [openSentences, setOpenSentences] = useState<Set<number>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  const gloss = picked ? glossary[picked.word.toLowerCase()] : undefined;

  function toggleSentence(i: number) {
    setOpenSentences((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  }

  function save() {
    if (!picked) return;
    const key = picked.word.toLowerCase();
    start(async () => {
      if (gloss?.itemId) await addItemsToReview(lang, [gloss.itemId]);
      else if (gloss?.translation)
        await saveWordToNotebook(lang, picked.word, gloss.translation, sentences[picked.sentence].text);
      setSaved((s) => new Set(s).add(key));
    });
  }

  return (
    <div className="flex flex-col gap-4 pb-40">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/learn/${lang}`} className="text-sm text-muted hover:text-ink">
          ← {labels.back}
        </Link>
        <SpeedToggle label={labels.speed} />
      </div>

      <header className="card">
        <span className="chip">📖 {level}</span>
        <h1 className="mt-2 font-display text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-muted">{labels.tapWord}</p>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
          {labels.showAll}
        </label>
      </header>

      <article className="card flex flex-col gap-4 text-xl leading-relaxed">
        {sentences.map((s, i) => (
          <div key={i}>
            <p>
              {s.text.split(TOKEN).map((part, j) =>
                j % 2 === 1 ? (
                  <button
                    key={j}
                    onClick={() => setPicked({ word: part, sentence: i })}
                    className={`rounded px-0.5 transition ${
                      picked?.word === part && picked.sentence === i
                        ? "bg-gold text-night"
                        : glossary[part.toLowerCase()]
                          ? "underline decoration-gold/50 decoration-dotted underline-offset-4 hover:bg-panel-2"
                          : "hover:bg-panel-2"
                    }`}
                  >
                    {part}
                  </button>
                ) : (
                  <span key={j}>{part}</span>
                ),
              )}
              <button onClick={() => toggleSentence(i)} className="ml-2 align-middle text-base opacity-70 hover:opacity-100" aria-label="Translate sentence">
                🌐
              </button>
              <button onClick={() => speak(s.text)} className="ml-1 align-middle text-base opacity-70 hover:opacity-100" aria-label="Listen">
                🔊
              </button>
            </p>
            {(showAll || openSentences.has(i)) && <p className="mt-1 text-base text-muted">{s.translation}</p>}
          </div>
        ))}
      </article>

      {done ? (
        <p className="card text-center font-bold text-mint">{labels.finished}</p>
      ) : (
        <button
          className="btn-primary"
          onClick={() => {
            setDone(true);
            start(() => completeReading(lang, readingId));
          }}
        >
          ✓ {labels.finish}
        </button>
      )}

      {picked && (
        <div className="fixed inset-x-0 bottom-20 z-30 px-4 sm:bottom-6">
          <div className="card mx-auto flex max-w-xl flex-col gap-3 border-gold/50 shadow-2xl shadow-black/50">
            <div className="flex items-center gap-3">
              <SpeakButton key={picked.word} text={gloss?.base ?? picked.word} audio={gloss?.audio} size="sm" autoPlay />
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-bold">
                  {picked.word}
                  {gloss?.base && gloss.base.toLowerCase() !== picked.word.toLowerCase() && (
                    <span className="ml-2 font-sans text-sm font-normal text-muted">({gloss.base})</span>
                  )}
                </p>
                <p className={gloss?.translation ? "" : "text-sm text-muted"}>{gloss?.translation || labels.noTranslation}</p>
              </div>
              <button onClick={() => setPicked(null)} className="text-xl text-muted" aria-label="Close">
                ✕
              </button>
            </div>
            {gloss?.translation && (
              <button className="btn-ghost" disabled={pending || saved.has(picked.word.toLowerCase())} onClick={save}>
                {saved.has(picked.word.toLowerCase())
                  ? labels.saved
                  : gloss.itemId
                    ? `🔁 ${labels.addReview}`
                    : `📓 ${labels.addNotebook}`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
