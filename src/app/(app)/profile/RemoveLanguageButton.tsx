"use client";

import { removeLanguage } from "./actions";

export function RemoveLanguageButton({
  language,
  label,
  confirmText,
}: {
  language: string;
  label: string;
  confirmText: string;
}) {
  return (
    <form
      action={removeLanguage}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
    >
      <input type="hidden" name="language" value={language} />
      <button className="text-sm font-bold text-coral hover:underline">{label}</button>
    </form>
  );
}
