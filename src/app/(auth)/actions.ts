"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; info?: string; detail?: string } | undefined;

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

async function siteOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/home";
}

export async function signInWithPassword(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "required" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "email_not_confirmed") return { error: "emailNotConfirmed" };
    return { error: "invalidCredentials" };
  }
  redirect(safeNext(formData.get("next")));
}

export async function signInWithMagicLink(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "required" };

  const supabase = await createClient();
  const next = safeNext(formData.get("next"));
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false, // only existing members; new people need an invite code
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  // Don't reveal whether the email exists: always show the same message.
  if (error && error.status !== 422 && error.status !== 400) return { error: "generic" };
  return { info: "checkEmail" };
}

export async function signUp(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const username = String(formData.get("username") ?? "").trim();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const inviteCode = String(formData.get("invite_code") ?? "").trim().toUpperCase();

  if (!email || !password || !username || !displayName || !inviteCode) return { error: "required" };
  if (!USERNAME_RE.test(username)) return { error: "usernameFormat" };
  if (password.length < 8) return { error: "passwordShort" };

  const supabase = await createClient();

  const { data: inviteOk, error: inviteErr } = await supabase.rpc("check_invite_code", { p_code: inviteCode });
  if (inviteErr) {
    console.error("check_invite_code failed", inviteErr);
    return { error: "generic", detail: `invite check: ${inviteErr.message}` };
  }
  if (!inviteOk) return { error: "invalidInvite" };

  const { data: free, error: nameErr } = await supabase.rpc("username_available", { p_username: username });
  if (nameErr) {
    console.error("username_available failed", nameErr);
    return { error: "generic", detail: `username check: ${nameErr.message}` };
  }
  if (!free) return { error: "usernameTaken" };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { invite_code: inviteCode, username, display_name: displayName.slice(0, 50) },
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=/onboarding`,
    },
  });

  if (error) {
    console.error("signUp failed", error);
    return { error: "generic", detail: `sign up: ${error.code ?? error.status ?? ""} ${error.message}` };
  }
  if (data.session) redirect("/onboarding");
  return { info: "checkEmail" };
}
