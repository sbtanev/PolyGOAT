"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp } from "../actions";
import { FormMessage } from "@/components/FormMessage";
import type { Dictionary } from "@/lib/i18n/en";

export function SignupForm({ t, code }: { t: Dictionary["auth"]; code: string }) {
  const [state, action, pending] = useActionState(signUp, undefined);
  const err = state?.error as keyof Dictionary["auth"]["errors"] | undefined;

  if (state?.info) return <FormMessage info={t.checkEmail} />;

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label className="label" htmlFor="invite_code">
          {t.inviteCode}
        </label>
        <input
          id="invite_code"
          name="invite_code"
          defaultValue={code}
          required
          autoCapitalize="characters"
          className="input font-mono uppercase tracking-wider"
        />
      </div>
      <div>
        <label className="label" htmlFor="display_name">
          {t.displayName}
        </label>
        <input id="display_name" name="display_name" required maxLength={50} className="input" />
        <p className="hint">{t.displayNameHint}</p>
      </div>
      <div>
        <label className="label" htmlFor="username">
          {t.username}
        </label>
        <input
          id="username"
          name="username"
          required
          pattern="[A-Za-z0-9_]{3,20}"
          autoCapitalize="none"
          autoComplete="username"
          className="input"
        />
        <p className="hint">{t.usernameHint}</p>
      </div>
      <div>
        <label className="label" htmlFor="email">
          {t.email}
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="password">
          {t.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="input"
        />
        <p className="hint">{t.passwordHint}</p>
      </div>

      <FormMessage error={err ? t.errors[err] + (state?.detail ? ` (${state.detail})` : "") : undefined} />

      <button disabled={pending} className="btn-primary">
        {t.signupButton}
      </button>
      <p className="text-center text-sm text-muted">
        {t.haveAccount}{" "}
        <Link href="/login" className="font-bold text-gold underline-offset-4 hover:underline">
          {t.loginButton}
        </Link>
      </p>
    </form>
  );
}
