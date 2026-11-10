"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Goat } from "@/components/Goat";
import { SpeakButton, SpeedToggle, useSpeak } from "@/components/Speak";
import { completeDialogue } from "../../actions";

type Line = {
  speaker: string;
  text: string;
  translation: string;
  choices?: { text: string; translation: string; correct: boolean; feedback?: string }[];
};

type Labels = {
  yourTurn: string;
  showTranslations: string;
  restart: string;
  finished: string;
  back: string;
  speed: string;
};

export function DialoguePlayer({
  id,
  lang,
  title,
  situation,
  icon,
  speakers,
  lines,
  learnerAccessory,
  labels,
}: {
  id: string;
  lang: string;
  title: string;
  situation: string;
  icon: string | null;
  speakers: Record<string, { name: string; accessory?: string }>;
  lines: Line[];
  learnerAccessory: string | null;
  labels: Labels;
}) {
  const speak = useSpeak();
  // `shown` = lines already in the chat; the chosen text replaces empty learner lines
  const [shown, setShown] = useState<{ speaker: string; text: string; translation: string }[]>([]);
  const [pos, setPos] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [showTr, setShowTr] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const current = lines[pos];
  const done = pos >= lines.length;

  // Advance automatically through lines that aren't the learner's choice
  useEffect(() => {
    if (!current || current.choices) return;
    const timer = setTimeout(
      () => {
        setShown((s) => [...s, current]);
        speak(current.text);
        setPos((p) => p + 1);
      },
      pos === 0 ? 300 : 900,
    );
    return () => clearTimeout(timer);
  }, [current, pos, speak]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [shown.length, wrong]);

  function choose(c: NonNullable<Line["choices"]>[number]) {
    if (!c.correct) {
      setWrong(c.feedback ?? "✗");
      return;
    }
    setWrong(null);
    setShown((s) => [...s, { speaker: current.speaker, text: c.text, translation: c.translation }]);
    speak(c.text);
    setPos((p) => p + 1);
  }

  const rewarded = useRef(false);
  useEffect(() => {
    if (done && !rewarded.current) {
      rewarded.current = true;
      completeDialogue(lang, id);
    }
  }, [done, lang, id]);

  const learnerKey = lines.find((l) => l.choices)?.speaker;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/learn/${lang}`} className="text-sm text-muted hover:text-ink">
          ← {labels.back}
        </Link>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1 text-xs text-muted">
            <input type="checkbox" checked={showTr} onChange={(e) => setShowTr(e.target.checked)} />
            {labels.showTranslations}
          </label>
          <SpeedToggle label={labels.speed} />
        </div>
      </div>

      <header className="card flex items-center gap-4">
        <span className="text-4xl">{icon ?? "🗨️"}</span>
        <div>
          <h1 className="font-display text-xl font-bold">{title}</h1>
          <p className="text-sm text-muted">{situation}</p>
        </div>
      </header>

      <div className="flex flex-col gap-3">
        {shown.map((l, i) => {
          const mine = l.speaker === learnerKey;
          const who = speakers[l.speaker];
          return (
            <div key={i} className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
              <Goat
                accessory={mine ? learnerAccessory : who?.accessory}
                fur={mine ? "#F1E4CF" : "#C79A6B"}
                size={44}
              />
              <div
                className={`max-w-[80%] rounded-3xl px-4 py-3 ${
                  mine ? "rounded-br-md bg-gold text-night" : "rounded-bl-md bg-panel-2"
                }`}
              >
                <p className={`text-xs font-bold ${mine ? "text-night/70" : "text-muted"}`}>{who?.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">{l.text}</p>
                  {!mine && <SpeakButton text={l.text} size="sm" />}
                </div>
                {showTr && <p className={`text-sm ${mine ? "text-night/70" : "text-muted"}`}>{l.translation}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {current?.choices && (
        <div className="card flex flex-col gap-3">
          <p className="font-bold text-gold">{labels.yourTurn}</p>
          {current.choices.map((c) => (
            <button
              key={c.text}
              onClick={() => choose(c)}
              className="rounded-2xl border-2 border-line bg-panel-2 px-4 py-3 text-left transition hover:border-muted"
            >
              <span className="block text-lg font-semibold">{c.text}</span>
              {showTr && <span className="block text-sm text-muted">{c.translation}</span>}
            </button>
          ))}
          {wrong && <p className="rounded-2xl bg-coral/10 px-4 py-3 text-sm text-coral">{wrong}</p>}
        </div>
      )}

      {done && (
        <div className="card flex flex-col items-center gap-3 py-8 text-center">
          <Goat accessory="crown" size={96} />
          <p className="font-display text-lg font-bold">{labels.finished}</p>
          <button className="btn-ghost" onClick={() => window.location.reload()}>
            {labels.restart}
          </button>
        </div>
      )}
      <div ref={bottom} />
    </div>
  );
}
