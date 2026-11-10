"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { setAvatarUrl } from "./actions";

const MAX_INPUT_BYTES = 10 * 1024 * 1024;
const OUTPUT_SIZE = 320;

/** Crops the picked image to a centered square and shrinks it before upload. */
/** Decode the picked file. Falls back to an <img> element, which Safari handles for more formats. */
async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number }> {
  try {
    const bitmap = await createImageBitmap(file);
    return { source: bitmap, width: bitmap.width, height: bitmap.height };
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return { source: img, width: img.naturalWidth, height: img.naturalHeight };
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
}

async function toSquareImage(file: File): Promise<Blob> {
  const bitmap = await decode(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.drawImage(
    bitmap.source,
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
    let stage = "read";
    try {
      const blob = await toSquareImage(file);
      stage = "upload";
      const ext = blob.type === "image/webp" ? "webp" : "jpg";
      const path = `${userId}/${Date.now()}.${ext}`;
      const supabase = createClient();
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { contentType: blob.type, upsert: false });
      if (upErr) throw upErr;
      stage = "save";
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      await setAvatarUrl(data.publicUrl);
    } catch (e) {
      console.error("avatar upload failed", stage, e);
      const msg =
        e instanceof Error || (typeof e === "object" && e && "message" in e)
          ? String((e as { message: unknown }).message || (e as { name?: string }).name || "")
          : String(e);
      setError(`${labels.failed} (${stage}${msg ? `: ${msg}` : ""}; ${file.type || "unknown type"})`);
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
