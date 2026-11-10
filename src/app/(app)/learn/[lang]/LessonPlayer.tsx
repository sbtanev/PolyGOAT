"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Goat } from "@/components/Goat";
import { Markdownish } from "@/components/Markdownish";
import { SpeakButton, SpeedToggle } from "@/components/Speak";
import { checkAnswer, type Verdict } from "@/lib/answers";
import type { Step } from "@/lib/exercises";
import type { Dictionary } from "@/lib/i18n/en";
import { finishSession } from "./actions";

type Labels = Dictionary["player"] & { speed: string; langName: string };

export function LessonPlayer({
  steps: initialSteps,
  lang,
  lessonId,
  accessory,
  labels,
}: {
  steps: Step[];
  lang: string;
  lessonId?: string;
  accessory?: string | null;
  labels: Labels;
}) {
  const [queue, setQueue] = useState(initialSteps);
  const [index, setIndex] = useState(0);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [results, setResults] = useState<{ itemId?: string; correct: boolean }[]>([]);
  const [requeued, setRequeued] = useState<Set<number>>(new Set());
  const [finished, setFinished] = useState<{ correct: number; total: number } | null>(null);
  const [, startTransition] = useTransition();

  const graded = useMemo(() => initialSteps.filter((s) => s.kind !== "intro" && s.kind !== "grammar").length, [initialSteps]);
  const step = queue[index];
  const progress = Math.round((index / queue.length) * 100);

  function next() {
    setVerdict(null);
    if (index + 1 < queue.length) {
      setIndex(index + 1);
      return;
    }
    // first-try answers decide the score; requeued repeats are just practice
    const firstTry = results.slice(0, graded);
    const correct = firstTry.filter((r) => r.correct).length;
    const total = firstTry.length;
    setFinished({ correct, total });
    startTransition(async () => {
      await finishSession({ lang, lessonId, results: firstTry, correct, total });
    });
  }

  function grade(v: Verdict) {
    setVerdict(v);
    const ok = v !== "wrong";
    const itemId = "itemId" in step ? step.itemId : undefined;
    if (!requeued.has(index)) {
      setResults((r) => [...r, { itemId, correct: ok }]);
    }
    if (!ok && !requeued.has(index)) {
      // see it again at the end
      setQueue((q) => [...q, step]);
      setRequeued((s) => new Set(s).add(queue.length));
    }
  }

  if (finished) {
    const pct = finished.total ? Math.round((finished.correct / finished.total) * 100) : 100;
    return (
      <div className="card flex flex-col items-center gap-4 py-10 text-center">
        <Goat accessory={pct >= 80 ? "crown" : accessory} size={120} />
        <h1 className="font-display text-2xl font-bold">{lessonId ? labels.finished : labels.practiceFinished}</h1>
        <p className="text-lg">
          {labels.score.replace("{correct}", String(finished.correct)).replace("{total}", String(finished.total))}
        </p>
        {lessonId && <p className="text-sm text-muted">{labels.reviewAdded}</p>}
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Link href={`/learn/${lang}`} className="btn-primary">
            {labels.backToCourse}
          </Link>
          <button className="btn-ghost" onClick={() => window.location.reload()}>
            {labels.tryAgain}
          </button>
        </div>
      </div>
    );
  }

  if (!step) return null;
  const isTeaching = step.kind === "intro" || step.kind === "grammar";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link href={`/learn/${lang}`} className="text-xl text-muted hover:text-ink" aria-label={labels.quit}>
          ✕
        </Link>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-panel-2">
          <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${progress}%` }} />
        </div>
        <SpeedToggle label={labels.speed} />
      </div>

      <div className="card min-h-[22rem]">
        <StepView key={index} step={step} labels={labels} verdict={verdict} onGrade={grade} />
      </div>

      <Footer
        verdict={verdict}
        isTeaching={isTeaching}
        step={step}
        labels={labels}
        onContinue={next}
      />
    </div>
  );
}

function Footer({
  verdict,
  isTeaching,
  step,
  labels,
  onContinue,
}: {
  verdict: Verdict | null;
  isTeaching: boolean;
  step: Step;
  labels: Labels;
  onContinue: () => void;
}) {
  if (isTeaching)
    return (
      <button className="btn-primary w-full" onClick={onContinue} autoFocus>
        {labels.continue}
      </button>
    );
  if (!verdict) return null;

  const answer = "answer" in step ? step.answer : "";
  const explanation = "explanation" in step ? step.explanation : undefined;
  const good = verdict !== "wrong";
  return (
    <div
      className={`flex flex-col gap-3 rounded-3xl border p-5 ${good ? "border-mint/50 bg-mint/10" : "border-coral/50 bg-coral/10"}`}
      role="status"
    >
      <p className={`font-display text-lg font-bold ${good ? "text-mint" : "text-coral"}`}>
        {verdict === "correct" ? labels.correct : verdict === "almost" ? labels.almost : labels.wrong}
        {verdict !== "correct" && <span className="ml-2 font-sans text-ink">{answer}</span>}
      </p>
      {explanation && <p className="text-sm">{explanation}</p>}
      <button className="btn-primary w-full" onClick={onContinue} autoFocus>
        {labels.continue}
      </button>
    </div>
  );
}

function StepView({
  step,
  labels,
  verdict,
  onGrade,
}: {
  step: Step;
  labels: Labels;
  verdict: Verdict | null;
  onGrade: (v: Verdict) => void;
}) {
  switch (step.kind) {
    case "grammar":
      return (
        <div>
          <p className="chip mb-3">📘 {step.title}</p>
          <Markdownish text={step.body} className="text-lg leading-relaxed" />
        </div>
      );
    case "intro":
      return (
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="chip text-gold">✨ {labels.newWord}</span>
          <div className="flex items-center gap-3">
            <p className="font-display text-3xl font-bold">{step.text}</p>
            <SpeakButton text={step.text} audio={step.audio} autoPlay />
          </div>
          {step.translit && <p className="-mt-2 italic text-mint">{step.translit}</p>}
          <p className="text-xl text-muted">{step.translation}</p>
          {step.native && (
            <p className="rounded-2xl bg-panel-2 px-4 py-2 text-sm">
              🗣️ <span className="text-muted">{labels.nativesSay}</span>{" "}
              <strong>{step.native}</strong>
            </p>
          )}
          {step.note && <p className="max-w-md text-sm text-muted">{step.note}</p>}
        </div>
      );
    case "mc_translation":
      return (
        <Choice
          title={labels.chooseTranslation}
          prompt={
            <span className="flex items-center gap-3">
              <span className="font-display text-2xl font-bold">{step.prompt}</span>
              <SpeakButton text={step.prompt} audio={step.audio} size="sm" />
              {step.translit && <span className="italic text-mint">{step.translit}</span>}
            </span>
          }
          options={step.options}
          answer={step.answer}
          verdict={verdict}
          onGrade={onGrade}
        />
      );
    case "mc_target":
      return (
        <Choice
          title={labels.chooseWord}
          prompt={<span className="font-display text-2xl font-bold">{step.prompt}</span>}
          options={step.options}
          answer={step.answer}
          verdict={verdict}
          onGrade={onGrade}
        />
      );
    case "listen":
      return (
        <Choice
          title={labels.listen}
          prompt={<SpeakButton text={step.say} audio={step.audio} size="lg" autoPlay />}
          options={step.options}
          answer={step.answer}
          verdict={verdict}
          onGrade={onGrade}
        />
      );
    case "choose":
      return (
        <Choice
          title={labels.choose}
          prompt={
            <span>
              <span className="block text-lg">{step.prompt}</span>
              {step.target && <span className="mt-1 block font-display text-xl font-bold">{step.target}</span>}
            </span>
          }
          options={step.options}
          answer={step.answer}
          verdict={verdict}
          onGrade={onGrade}
        />
      );
    case "type_target":
      return (
        <Typed
          title={labels.typeWord.replace("{lang}", labels.langName)}
          prompt={
            <span>
              <span className="block font-display text-2xl font-bold">{step.prompt}</span>
              {step.alternatives?.length ? <span className="mt-1 block text-sm text-muted">⌨️ {labels.latinOk}</span> : null}
            </span>
          }
          answers={[step.answer, ...(step.alternatives ?? [])]}
          verdict={verdict}
          onGrade={onGrade}
          labels={labels}
        />
      );
    case "fill":
      if (step.options)
        return (
          <Choice
            title={labels.fill}
            prompt={<BlankSentence text={step.prompt} hint={step.hint} hintLabel={labels.hint} />}
            options={step.options}
            answer={step.answer}
            verdict={verdict}
            onGrade={onGrade}
          />
        );
      return (
        <Typed
          title={labels.fill}
          prompt={<BlankSentence text={step.prompt} hint={step.hint} hintLabel={labels.hint} />}
          answers={[step.answer, ...step.alternatives]}
          verdict={verdict}
          onGrade={onGrade}
          labels={labels}
        />
      );
    case "order":
      return <Order step={step} verdict={verdict} onGrade={onGrade} labels={labels} />;
  }
}

function BlankSentence({ text, hint, hintLabel }: { text: string; hint?: string; hintLabel: string }) {
  const [before, after] = text.split("___");
  return (
    <span>
      <span className="font-display text-2xl font-bold">
        {before}
        <span className="mx-1 inline-block min-w-16 border-b-4 border-gold">&nbsp;</span>
        {after}
      </span>
      {hint && (
        <span className="mt-2 block text-sm text-muted">
          💡 {hintLabel}: {hint}
        </span>
      )}
    </span>
  );
}

function Choice({
  title,
  prompt,
  options,
  answer,
  verdict,
  onGrade,
}: {
  title: string;
  prompt: React.ReactNode;
  options: string[];
  answer: string;
  verdict: Verdict | null;
  onGrade: (v: Verdict) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm font-bold text-muted">{title}</p>
      <div className="flex min-h-16 items-center">{prompt}</div>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => {
          const isAnswer = o === answer;
          const state = verdict ? (isAnswer ? "right" : picked === o ? "wrong" : "idle") : "idle";
          return (
            <button
              key={o}
              disabled={Boolean(verdict)}
              onClick={() => {
                setPicked(o);
                onGrade(isAnswer ? "correct" : "wrong");
              }}
              className={`min-h-14 rounded-2xl border-2 px-4 py-3 text-left text-lg font-semibold transition ${
                state === "right"
                  ? "border-mint bg-mint/15"
                  : state === "wrong"
                    ? "border-coral bg-coral/15"
                    : "border-line bg-panel-2 hover:border-muted disabled:opacity-60"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Typed({
  title,
  prompt,
  answers,
  verdict,
  onGrade,
  labels,
}: {
  title: string;
  prompt: React.ReactNode;
  answers: string[];
  verdict: Verdict | null;
  onGrade: (v: Verdict) => void;
  labels: Labels;
}) {
  const [value, setValue] = useState("");
  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!verdict && value.trim()) onGrade(checkAnswer(value, answers));
      }}
    >
      <p className="text-sm font-bold text-muted">{title}</p>
      <div className="flex min-h-16 items-center">{prompt}</div>
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={Boolean(verdict)}
        placeholder={labels.typeHere}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        lang="und"
        className="input text-lg"
      />
      {!verdict && (
        <div className="flex gap-2">
          <button type="button" className="btn-ghost" onClick={() => onGrade("wrong")}>
            {labels.skip}
          </button>
          <button className="btn-primary flex-1" disabled={!value.trim()}>
            {labels.check}
          </button>
        </div>
      )}
    </form>
  );
}

function Order({
  step,
  verdict,
  onGrade,
  labels,
}: {
  step: Extract<Step, { kind: "order" }>;
  verdict: Verdict | null;
  onGrade: (v: Verdict) => void;
  labels: Labels;
}) {
  const [chosen, setChosen] = useState<number[]>([]);
  const sentence = chosen.map((i) => step.words[i]).join(" ");
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm font-bold text-muted">{labels.order}</p>
      <p className="text-xl">{step.translation}</p>
      <div className="flex min-h-16 flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed border-line p-3">
        {chosen.map((i, pos) => (
          <button
            key={`${i}-${pos}`}
            disabled={Boolean(verdict)}
            onClick={() => setChosen((c) => c.filter((_, p) => p !== pos))}
            className="rounded-xl bg-gold px-3 py-2 font-bold text-night"
          >
            {step.words[i]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {step.words.map((w, i) => (
          <button
            key={i}
            disabled={chosen.includes(i) || Boolean(verdict)}
            onClick={() => setChosen((c) => [...c, i])}
            className="rounded-xl border-2 border-line bg-panel-2 px-3 py-2 font-bold disabled:opacity-25"
          >
            {w}
          </button>
        ))}
      </div>
      {!verdict && (
        <div className="flex gap-2">
          <button type="button" className="btn-ghost" onClick={() => setChosen([])}>
            {labels.reset}
          </button>
          <button
            className="btn-primary flex-1"
            disabled={chosen.length !== step.words.length}
            onClick={() => onGrade(checkAnswer(sentence, [step.answer]))}
          >
            {labels.check}
          </button>
        </div>
      )}
    </div>
  );
}
