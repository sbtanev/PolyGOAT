"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { setAvatarUrl } from "./actions";

const MAX_INPUT_BYTES = 10 * 1024 * 1024;
const OUTPUT_SIZE = 320;

/** Crops the picked image to a centered square and shrinks it before upload. */
async function toSquareImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
  if (blob && blob.type === "image/webp") return blob;
  const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!jpeg) throw new Error("encode failed");
  return jpeg;
}

export function AvatarUpload({
  userId,
  labels,
}: {
  userId: string;
  labels: { upload: string; uploading: string; hint: string; tooBig: string; failed: string };
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_INPUT_BYTES) return setError(labels.tooBig);

    setBusy(true);
    setError(null);
    try {
      const blob = await toSquareImage(file);
      const ext = blob.type === "image/webp" ? "webp" : "jpg";
      const path = `${userId}/${Date.now()}.${ext}`;
      const supabase = createClient();
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { contentType: blob.type, upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      await setAvatarUrl(data.publicUrl);
    } catch {
      setError(labels.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input ref={input} type="file" accept="image/*" onChange={onPick} className="hidden" />
      <button type="button" className="btn-ghost" disabled={busy} onClick={() => input.current?.click()}>
        📷 {busy ? labels.uploading : labels.upload}
      </button>
      <p className="hint">{labels.hint}</p>
      {error && <p className="mt-2 text-sm text-coral">{error}</p>}
    </div>
  );
}
