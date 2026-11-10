"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/data";

export async function adminUserAction(formData: FormData) {
  const me = await requireProfile();
  if (me.role !== "admin") return;
  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? "");
  const supabase = await createClient();

  if (action === "toggle_admin" && id !== me.id) {
    const { data } = await supabase.from("profiles").select("role").eq("id", id).single();
    await supabase.from("profiles").update({ role: data?.role === "admin" ? "user" : "admin" }).eq("id", id);
  } else if (action === "reset_name") {
    const { data } = await supabase.from("profiles").select("username").eq("id", id).single();
    if (data) await supabase.from("profiles").update({ display_name: String(data.username) }).eq("id", id);
  } else if (action === "approve" || action === "reject") {
    await supabase.from("profiles").update({ status: action === "approve" ? "active" : "rejected" }).eq("id", id);
  } else if (action === "reset_avatar") {
    await supabase.from("profiles").update({ avatar_url: null, avatar_preset: "classic" }).eq("id", id);
  }
  revalidatePath("/", "layout");
}
