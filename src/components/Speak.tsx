"use client";

import { createContext, use, useCallback, useEffect, useState } from "react";

const SPEEDS = [0.75, 1, 1.25] as const;
const SPEED_KEY = "pg-speed";

type AudioCtx = { locale: string; speed: number; setSpeed: (s: number) => void };
const Ctx = createContext<AudioCtx>({ locale: "en-US", speed: 1, setSpeed: () => {} });

/** Wrap a page in this so every Speak button knows the language and the chosen speed. */
export function AudioProvider({ locale, children }: { locale: string; children: React.ReactNode }) {
  const [speed, setSpeedState] = useState(1);
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(SPEED_KEY));
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring a saved preference after hydration
      if (SPEEDS.includes(saved as (typeof SPEEDS)[number])) setSpeedState(saved);
    } catch {}
  }, []);
  const setSpeed = useCallback((s: number) => {
    setSpeedState(s);
    try {
      localStorage.setItem(SPEED_KEY, String(s));
    } catch {}
  }, []);
  return <Ctx value={{ locale, speed, setSpeed }}>{children}</Ctx>;
}

let current: HTMLAudioElement | null = null;

export function useSpeak() {
  const { locale, speed } = use(Ctx);
  return useCallback(
    (text: string, audioUrl?: string | null) => {
      if (typeof window === "undefined") return;
      current?.pause();
      window.speechSynthesis?.cancel();
      if (audioUrl) {
        const a = new Audio(audioUrl);
        a.playbackRate = speed;
        current = a;
        a.play().catch(() => speakWithBrowser(text, locale, speed));
        return;
      }
      speakWithBrowser(text, locale, speed);
    },
    [locale, speed],
  );
}

function speakWithBrowser(text: string, locale: string, speed: number) {
  const synth = window.speechSynthesis;
  if (!synth || !text) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = locale;
  u.rate = speed * 0.95;
  const voices = synth.getVoices();
  const base = locale.split("-")[0];
  u.voice =
    voices.find((v) => v.lang === locale) ?? voices.find((v) => v.lang.toLowerCase().startsWith(base)) ?? null;
  synth.speak(u);
}

export function SpeakButton({
  text,
  audio,
  label = "▶",
  size = "md",
  autoPlay = false,
}: {
  text: string;
  audio?: string | null;
  label?: string;
  size?: "sm" | "md" | "lg";
  autoPlay?: boolean;
}) {
  const speak = useSpeak();
  useEffect(() => {
    if (autoPlay) speak(text, audio);
  }, [autoPlay, speak, text, audio]);
  const dims = size === "lg" ? "h-16 w-16 text-2xl" : size === "sm" ? "h-9 w-9 text-sm" : "h-12 w-12 text-lg";
  return (
    <button
      type="button"
      onClick={() => speak(text, audio)}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-mint/15 text-mint ring-1 ring-mint/40 transition hover:bg-mint/25 ${dims}`}
      aria-label={`Play: ${text}`}
    >
      {label === "▶" ? "🔊" : label}
    </button>
  );
}

export function SpeedToggle({ label }: { label: string }) {
  const { speed, setSpeed } = use(Ctx);
  return (
    <div className="flex items-center gap-1 text-xs" role="group" aria-label={label}>
      <span className="mr-1 text-muted">{label}</span>
      {SPEEDS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => setSpeed(s)}
          aria-pressed={speed === s}
          className={`rounded-full px-2.5 py-1 font-bold ${speed === s ? "bg-mint text-night" : "bg-panel-2 text-muted"}`}
        >
          {s}×
        </button>
      ))}
    </div>
  );
}
