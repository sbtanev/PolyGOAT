"use client";

import { useActionState, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { FormMessage } from "@/components/FormMessage";
import { AVATAR_PRESETS } from "@/lib/avatars";
import type { Dictionary } from "@/lib/i18n/en";
import type { Profile } from "@/lib/data";
import { updateProfile } from "./actions";

export function ProfileForm({
  profile,
  t,
  authT,
}: {
  profile: Profile;
  t: Dictionary["profile"];
  authT: Dictionary["auth"];
}) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  const [preset, setPreset] = useState("keep");
  const err = state?.error as keyof Dictionary["auth"]["errors"] | undefined;

  return (
    <form action={action} className="flex flex-col gap-5">
      <fieldset>
        <legend className="label">{t.presets}</legend>
        <input type="hidden" name="avatar_preset" value={preset} />
        <div className="flex flex-wrap gap-2">
          {AVATAR_PRESETS.map((p) => {
            const selected = preset === p.id || (preset === "keep" && !profile.avatar_url && profile.avatar_preset === p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                aria-pressed={selected}
                aria-label={p.id}
                className={`rounded-full p-1 transition ${selected ? "ring-3 ring-gold" : "ring-1 ring-transparent hover:ring-line"}`}
              >
                <Avatar preset={p.id} size={52} />
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label className="label" htmlFor="display_name">
          {authT.displayName}
        </label>
        <input
          id="display_name"
          name="display_name"
          defaultValue={profile.display_name}
          maxLength={50}
          required
          className="input"
        />
        <p className="hint">{authT.displayNameHint}</p>
      </div>
      <div>
        <label className="label" htmlFor="username">
          {authT.username}
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">@</span>
          <input
            id="username"
            name="username"
            defaultValue={profile.username}
            pattern="[A-Za-z0-9_]{3,20}"
            required
            autoCapitalize="none"
            className="input pl-8"
          />
        </div>
        <p className="hint">{authT.usernameHint}</p>
      </div>
      <div>
        <label className="label" htmlFor="bio">
          {t.bio}
        </label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={profile.bio ?? ""}
          maxLength={200}
          rows={3}
          className="input py-3"
        />
        <p className="hint">{t.bioHint}</p>
      </div>

      <FormMessage error={err ? authT.errors[err] : undefined} info={state?.saved ? t.saved : undefined} />
      <button className="btn-primary sm:self-start" disabled={pending}>
        {t.save}
      </button>
    </form>
  );
}
