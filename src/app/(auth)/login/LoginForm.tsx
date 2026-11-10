"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInWithMagicLink, signInWithPassword } from "../actions";
import { FormMessage } from "@/components/FormMessage";
import type { Dictionary } from "@/lib/i18n/en";

export function LoginForm({ t, next }: { t: Dictionary["auth"]; next: string }) {
  const [pwState, pwAction, pwPending] = useActionState(signInWithPassword, undefined);
  const [mlState, mlAction, mlPending] = useActionState(signInWithMagicLink, undefined);
  const state = mlState ?? pwState;
  const err = state?.error as keyof Dictionary["auth"]["errors"] | undefined;

  return (
    <form className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="label" htmlFor="email">
          {t.email}
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="password">
          {t.password}
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" className="input" />
      </div>

      <FormMessage error={err ? t.errors[err] : undefined} info={state?.info ? t.checkEmail : undefined} />

      <button formAction={pwAction} disabled={pwPending || mlPending} className="btn-primary">
        {t.loginButton}
      </button>
      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        {t.or}
        <span className="h-px flex-1 bg-line" />
      </div>
      <button formAction={mlAction} formNoValidate disabled={pwPending || mlPending} className="btn-ghost">
        ✉️ {t.magicButton}
      </button>

      <p className="text-center text-sm text-muted">
        {t.noAccount}{" "}
        <Link href="/signup" className="font-bold text-gold underline-offset-4 hover:underline">
          {t.signupButton}
        </Link>
      </p>
    </form>
  );
}
