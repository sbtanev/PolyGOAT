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
  const permanent = formData.get("permanent") === "1";
  const approval = formData.get("approval") === "1";
  const maxUses = permanent ? 100000 : Math.min(100, Math.max(1, Number(formData.get("max_uses")) || 1));
  const note = String(formData.get("note") ?? "").trim().slice(0, 100) || null;

  const supabase = await createClient();
  await supabase.from("invite_codes").insert({
    code: custom || randomCode(),
    max_uses: maxUses,
    note,
    created_by: profile.id,
    ...(approval ? { requires_approval: true } : {}),
  });
  revalidatePath("/admin/invites");
}

/** Turn approval on/off for an existing code, or stop a code from being used any more. */
export async function updateInvite(formData: FormData) {
  const profile = await requireProfile();
  if (profile.role !== "admin") return;
  const code = String(formData.get("code") ?? "");
  const action = String(formData.get("action") ?? "");
  const supabase = await createClient();

  if (action === "approval_on" || action === "approval_off") {
    await supabase.from("invite_codes").update({ requires_approval: action === "approval_on" }).eq("code", code);
  } else if (action === "disable") {
    const { data } = await supabase.from("invite_codes").select("uses").eq("code", code).single();
    if (data) await supabase.from("invite_codes").update({ max_uses: Math.max(1, data.uses as number) }).eq("code", code);
  }
  revalidatePath("/admin/invites");
}
