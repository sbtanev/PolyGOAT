"use client";

import { useState } from "react";

export function CopyLink({ code, labels }: { code: string; labels: { copy: string; copied: string } }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="chip min-h-9 px-3 hover:border-muted"
      onClick={async () => {
        await navigator.clipboard.writeText(`${window.location.origin}/signup?code=${encodeURIComponent(code)}`);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      🔗 {done ? labels.copied : labels.copy}
    </button>
  );
}
