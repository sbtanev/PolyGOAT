"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/data";

function randomCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `GOAT-${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")}`;
}

export async function createInvite(formData: FormData) {
  const profile = await requireProfile();
  if (profile.role !== "admin") return;

  const custom = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "");
  const maxUses = Math.min(100, Math.max(1, Number(formData.get("max_uses")) || 1));
  const note = String(formData.get("note") ?? "").trim().slice(0, 100) || null;

  const supabase = await createClient();
  await supabase.from("invite_codes").insert({
    code: custom || randomCode(),
    max_uses: maxUses,
    note,
    created_by: profile.id,
  });
  revalidatePath("/admin/invites");
}
