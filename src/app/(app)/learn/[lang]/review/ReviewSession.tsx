"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Goat } from "@/components/Goat";
import { SpeakButton, SpeedToggle } from "@/components/Speak";
import { rateCard } from "../actions";

export type ReviewCard = {
  id: number;
  front: string;
  sub?: string;
  back: string;
  extra?: string;
  audio?: string | null;
  fromNotebook: boolean;
};

type Labels = {
  showAnswer: string;
  again: string;
  hard: string;
  good: string;
  easy: string;
  left: string;
  finished: string;
  fromNotebook: string;
  back: string;
  speed: string;
  nothingDue: string;
};

export function ReviewSession({ lang, cards, labels }: { lang: string; cards: ReviewCard[]; labels: Labels }) {
  const [queue, setQueue] = useState(cards);
  const [revealed, setRevealed] = useState(false);
  const [, start] = useTransition();
  const card = queue[0];

  function rate(grade: 1 | 2 | 3 | 4) {
    const c = card;
    start(() => rateCard(c.id, grade));
    setRevealed(false);
    // "Again" comes back later in this session
    setQueue((q) => (grade === 1 ? [...q.slice(1), c] : q.slice(1)));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/learn/${lang}`} className="text-sm text-muted hover:text-ink">
          ← {labels.back}
        </Link>
        {card && <span className="chip">{labels.left.replace("{n}", String(queue.length))}</span>}
        <SpeedToggle label={labels.speed} />
      </div>

      {!card ? (
        <div className="card flex flex-col items-center gap-3 py-12 text-center">
          <Goat accessory="crown" size={110} />
          <p className="font-display text-lg font-bold">{cards.length ? labels.finished : labels.nothingDue}</p>
        </div>
      ) : (
        <>
          <div className="card flex min-h-[20rem] flex-col items-center justify-center gap-4 text-center">
            {card.fromNotebook && <span className="chip">📓 {labels.fromNotebook}</span>}
            <div className="flex items-center gap-3">
              <p className="font-display text-3xl font-bold">{card.front}</p>
              <SpeakButton key={card.id} text={card.front} audio={card.audio} autoPlay />
            </div>
            {card.sub && <p className="-mt-2 italic text-mint">{card.sub}</p>}
            {revealed && (
              <>
                <div className="h-px w-24 bg-line" />
                <p className="text-2xl">{card.back}</p>
                {card.extra && <p className="max-w-md text-sm text-muted">{card.extra}</p>}
              </>
            )}
          </div>

          {!revealed ? (
            <button className="btn-primary w-full" onClick={() => setRevealed(true)} autoFocus>
              {labels.showAnswer}
            </button>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              <button className="btn border-2 border-coral/60 bg-coral/10" onClick={() => rate(1)}>
                {labels.again}
              </button>
              <button className="btn border-2 border-line bg-panel-2" onClick={() => rate(2)}>
                {labels.hard}
              </button>
              <button className="btn border-2 border-mint/60 bg-mint/10" onClick={() => rate(3)}>
                {labels.good}
              </button>
              <button className="btn border-2 border-gold/60 bg-gold/10" onClick={() => rate(4)}>
                {labels.easy}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
