"use client";

import { useActionState } from "react";
import { deleteRow, saveItem, saveRow } from "./actions";
import type { SaveState } from "./tables";

type L = { save: string; saved: string; delete: string; confirmDelete: string; status: string; verified: string; auto: string };

function Result({ state, saved }: { state: SaveState; saved: string }) {
  if (state?.ok) return <span className="text-sm text-mint">{saved}</span>;
  if (state?.error) return <span className="text-sm text-coral">{state.error}</span>;
  return null;
}

export function ItemEditor({
  item,
  lang,
  baseLanguages,
  labels,
}: {
  item: { id: string; text: string; kind: string; native: string | null; translations: Record<string, string>; translation_status: Record<string, string> };
  lang: string;
  baseLanguages: { code: string; flag: string }[];
  labels: L;
}) {
  const [state, action, pending] = useActionState(saveItem, undefined);
  const isNew = !item.id;
  return (
    <div className="flex flex-col gap-2">
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="language_code" value={lang} />
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_8rem]">
        <input name="id" defaultValue={item.id} readOnly={!isNew} placeholder={`${lang}-word`} className="input font-mono text-sm" required />
        <input name="text" defaultValue={item.text} className="input font-bold" required />
        <select name="kind" defaultValue={item.kind} className="input">
          <option value="word">word</option>
          <option value="phrase">phrase</option>
          <option value="sentence">sentence</option>
        </select>
      </div>
      <input name="native" defaultValue={item.native ?? ""} placeholder="🗣️ native version" className="input" />
      <div className="grid gap-2">
        {baseLanguages
          .filter((b) => b.code !== lang)
          .map((b) => (
            <div key={b.code} className="grid grid-cols-[2rem_1fr_7.5rem] items-center gap-2">
              <span>{b.flag}</span>
              <input name={`tr_${b.code}`} defaultValue={item.translations?.[b.code] ?? ""} className="input min-h-10" />
              <select
                name={`st_${b.code}`}
                defaultValue={item.translation_status?.[b.code] ?? "auto"}
                className="input min-h-10 text-sm"
                aria-label={labels.status}
              >
                <option value="auto">🤖 {labels.auto}</option>
                <option value="verified">✅ {labels.verified}</option>
              </select>
            </div>
          ))}
      </div>
      <div className="flex items-center gap-3">
        <button className="btn-primary" disabled={pending}>
          {labels.save}
        </button>
        <Result state={state} saved={labels.saved} />
      </div>
    </form>
    {!isNew && <DeleteButton table="items" id={item.id} labels={labels} />}
    </div>
  );
}

export function JsonEditor({
  table,
  lang,
  row,
  labels,
}: {
  table: string;
  lang: string;
  row: Record<string, unknown>;
  labels: L;
}) {
  const [state, action, pending] = useActionState(saveRow, undefined);
  const { language_code: _omit, ...editable } = row;
  void _omit;
  const text = JSON.stringify(editable, null, 2);
  return (
    <div className="flex flex-col gap-2">
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="table" value={table} />
      <input type="hidden" name="language_code" value={lang} />
      <textarea
        name="json"
        defaultValue={text}
        rows={Math.min(30, text.split("\n").length + 1)}
        spellCheck={false}
        className="input min-h-40 py-3 font-mono text-xs leading-relaxed"
      />
      <div className="flex items-center gap-3">
        <button className="btn-primary" disabled={pending}>
          {labels.save}
        </button>
        <Result state={state} saved={labels.saved} />
      </div>
    </form>
    {typeof row.id === "string" && row.id && <DeleteButton table={table} id={row.id} labels={labels} />}
    </div>
  );
}

function DeleteButton({ table, id, labels }: { table: string; id: string; labels: L }) {
  return (
    <form
      action={deleteRow}
      onSubmit={(e) => {
        if (!confirm(labels.confirmDelete)) e.preventDefault();
      }}
      className="flex justify-end"
    >
      <input type="hidden" name="table" value={table} />
      <input type="hidden" name="id" value={id} />
      <button className="text-sm text-coral hover:underline">{labels.delete}</button>
    </form>
  );
}
