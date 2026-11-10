"use client";

import { useActionState } from "react";
import { importBundledPack } from "./actions";

export function ImportButton({ code, label, pendingLabel, doneLabel }: { code: string; label: string; pendingLabel: string; doneLabel: string }) {
  const [result, action, pending] = useActionState(importBundledPack, undefined);
  return (
    <form action={action} className="flex flex-col items-end gap-2">
      <input type="hidden" name="code" value={code} />
      <button className="btn-primary" disabled={pending}>
        {pending ? pendingLabel : label}
      </button>
      {result?.ok && (
        <p className="text-right text-sm text-mint">
          ✓ {doneLabel}:{" "}
          {Object.entries(result.counts)
            .map(([k, v]) => `${k} ${v}`)
            .join(", ")}
        </p>
      )}
      {result && !result.ok && (
        <ul className="max-w-md text-right text-sm text-coral">
          {result.errors.slice(0, 10).map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
    </form>
  );
}
