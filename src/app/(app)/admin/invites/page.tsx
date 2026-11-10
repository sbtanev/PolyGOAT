import type { Metadata } from "next";
import { createInvite } from "./actions";
import { CopyLink } from "./CopyLink";
import { getDictionary } from "@/lib/i18n";
import { requireProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Invite codes" };

type Invite = { code: string; max_uses: number; uses: number; note: string | null; created_at: string; requires_approval?: boolean };

const UNLIMITED = 100000;

export default async function InvitesPage() {
  const profile = await requireProfile();
  const { t, locale } = await getDictionary();
  if (profile.role !== "admin") return <p className="card text-muted">{t.admin.onlyAdmins}</p>;

  const supabase = await createClient();
  const { data } = await supabase.from("invite_codes").select("*").order("created_at", { ascending: false });
  const invites = (data ?? []) as Invite[];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-xl font-bold sm:text-2xl">{t.admin.invitesTitle}</h1>

      <form action={createInvite} className="card grid gap-4 sm:grid-cols-[1fr_8rem_1fr_auto] sm:items-end">
        <div>
          <label className="label" htmlFor="code">
            {t.admin.code}
          </label>
          <input id="code" name="code" placeholder="GOAT-…" className="input font-mono uppercase" />
          <p className="hint">{t.admin.codeHint}</p>
        </div>
        <div>
          <label className="label" htmlFor="max_uses">
            {t.admin.maxUses}
          </label>
          <input id="max_uses" name="max_uses" type="number" min={1} max={100} defaultValue={1} className="input" />
          <p className="hint">&nbsp;</p>
        </div>
        <div>
          <label className="label" htmlFor="note">
            {t.admin.note}
          </label>
          <input id="note" name="note" maxLength={100} className="input" />
          <p className="hint">&nbsp;</p>
        </div>
        <div>
          <button className="btn-primary w-full">{t.admin.create}</button>
          <p className="hint">&nbsp;</p>
        </div>
        <label className="flex items-start gap-3 rounded-2xl bg-panel-2 p-3 sm:col-span-4">
          <input type="checkbox" name="permanent" value="1" className="mt-1 h-5 w-5 accent-[var(--color-gold)]" />
          <span>
            <span className="block font-bold">♾️ {t.approval.permanent}</span>
            <span className="block text-sm text-muted">{t.approval.permanentHint}</span>
          </span>
        </label>
      </form>

      <ul className="flex flex-col gap-2">
        {invites.map((inv) => {
          const usedUp = inv.uses >= inv.max_uses;
          return (
            <li
              key={inv.code}
              className={`card flex flex-wrap items-center justify-between gap-3 p-4 sm:p-4 ${usedUp ? "opacity-50" : ""}`}
            >
              <div>
                <p className="font-mono font-bold tracking-wider">
                  {inv.code}
                  {inv.requires_approval && <span className="chip ml-2 font-sans text-gold">✋ {t.approval.needsApproval}</span>}
                </p>
                <p className="text-sm text-muted">
                  {t.admin.uses}: {inv.uses}/{inv.max_uses >= UNLIMITED ? `♾️ ${t.approval.unlimited}` : inv.max_uses}
                  {inv.note && ` · ${inv.note}`} · {t.admin.created}{" "}
                  {new Date(inv.created_at).toLocaleDateString(locale === "bg" ? "bg-BG" : "en-GB")}
                </p>
              </div>
              {!usedUp && <CopyLink code={inv.code} labels={{ copy: t.admin.copy, copied: t.admin.copied }} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
