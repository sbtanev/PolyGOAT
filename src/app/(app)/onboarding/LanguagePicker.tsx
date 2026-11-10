"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Goat } from "@/components/Goat";
import { addLanguage } from "./actions";

type Option = { code: string; label: string; flag: string; accessory?: string | null; disabled?: boolean; note?: string };

export function LanguagePicker({
  targets,
  sources,
  labels,
}: {
  targets: Option[];
  sources: Option[];
  labels: { step1: string; step2: string; start: string };
}) {
  const firstAvailable = targets.find((t) => !t.disabled)?.code ?? "";
  const [target, setTarget] = useState(firstAvailable);
  const sourceOptions = sources.filter((s) => s.code !== target);
  const [source, setSource] = useState(sourceOptions[0]?.code ?? "");
  const validSource = sourceOptions.some((s) => s.code === source) ? source : sourceOptions[0]?.code ?? "";
  const accessory = targets.find((t) => t.code === target)?.accessory;

  return (
    <form action={addLanguage} className="flex flex-col gap-6">
      <fieldset>
        <legend className="mb-3 font-display font-bold">1. {labels.step1}</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {targets.map((o) => (
            <label
              key={o.code}
              className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 transition has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-45 ${
                target === o.code ? "border-gold bg-gold/10" : "border-line bg-panel-2 hover:border-muted"
              }`}
            >
              <input
                type="radio"
                name="language"
                value={o.code}
                checked={target === o.code}
                disabled={o.disabled}
                onChange={() => setTarget(o.code)}
                className="sr-only"
              />
              <span className="text-2xl" aria-hidden>
                {o.flag}
              </span>
              <span className="leading-tight">
                <span className="block font-bold">{o.label}</span>
                {o.note && <span className="block text-xs text-muted">{o.note}</span>}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {target && (
        <fieldset>
          <legend className="mb-3 font-display font-bold">2. {labels.step2}</legend>
          <div className="flex flex-wrap gap-2">
            {sourceOptions.map((o) => (
              <label
                key={o.code}
                className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-2xl border-2 px-4 transition ${
                  validSource === o.code ? "border-mint bg-mint/10" : "border-line bg-panel-2 hover:border-muted"
                }`}
              >
                <input
                  type="radio"
                  name="source"
                  value={o.code}
                  checked={validSource === o.code}
                  onChange={() => setSource(o.code)}
                  className="sr-only"
                />
                <span aria-hidden>{o.flag}</span>
                <span className="font-bold">{o.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex items-center gap-4">
        <Goat accessory={accessory} size={72} />
        <SubmitButton label={labels.start} disabled={!target || !validSource} />
      </div>
    </form>
  );
}

function SubmitButton({ label, disabled }: { label: string; disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn-primary flex-1 sm:flex-none" disabled={disabled || pending}>
      {label} →
    </button>
  );
}
