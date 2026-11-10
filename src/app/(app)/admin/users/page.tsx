import type { Metadata } from "next";
import { Avatar } from "@/components/Avatar";
import { adminUserAction } from "./actions";
import { getDictionary } from "@/lib/i18n";
import { requireProfile, type Profile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const me = await requireProfile();
  const { t, locale } = await getDictionary();
  if (me.role !== "admin") return <p className="card text-muted">{t.admin.onlyAdmins}</p>;
  const a = t.adminContent;

  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").order("created_at");
  const users = (data ?? []) as Profile[];
  const date = (s: string) => new Date(s).toLocaleDateString(locale === "bg" ? "bg-BG" : "en-GB");

  const Btn = ({ id, action, label, danger }: { id: string; action: string; label: string; danger?: boolean }) => (
    <form action={adminUserAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="action" value={action} />
      <button className={`chip min-h-9 px-3 ${danger ? "text-coral" : ""}`}>{label}</button>
    </form>
  );

  const pending = users.filter((u) => u.status === "pending");
  const rejected = users.filter((u) => u.status === "rejected");
  const members = users.filter((u) => !u.status || u.status === "active");
  const ap = t.approval;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-xl font-bold sm:text-2xl">👥 {a.users}</h1>

      <section className={`card ${pending.length ? "border-gold/60" : ""}`}>
        <h2 className="mb-3 font-display text-lg font-bold">
          ✋ {ap.pendingList} {pending.length > 0 && <span className="chip ml-1 text-gold">{pending.length}</span>}
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted">{ap.noPending}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {pending.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-panel-2 p-3">
                <Avatar url={u.avatar_url} preset={u.avatar_preset} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{u.display_name}</p>
                  <p className="text-sm text-muted">
                    @{u.username} · {a.joined} {date(u.created_at)}
                  </p>
                </div>
                <form action={adminUserAction}>
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="action" value="approve" />
                  <button className="btn-primary min-h-10 px-4">✓ {ap.approve}</button>
                </form>
                <Btn id={u.id} action="reject" label={ap.reject} danger />
              </li>
            ))}
          </ul>
        )}
      </section>

      <ul className="flex flex-col gap-2">
        {members.map((u) => (
          <li key={u.id} className="card flex flex-wrap items-center gap-4 p-4 sm:p-4">
            <Avatar url={u.avatar_url} preset={u.avatar_preset} size={48} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">
                {u.display_name} {u.role === "admin" && <span className="chip ml-1">🛠️ admin</span>}
              </p>
              <p className="text-sm text-muted">
                @{u.username} · {a.joined} {date(u.created_at)} · {a.lastSeen} {date(u.last_seen_at)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {u.id !== me.id && (
                <Btn id={u.id} action="toggle_admin" label={u.role === "admin" ? a.removeAdmin : a.makeAdmin} />
              )}
              <Btn id={u.id} action="reset_name" label={a.resetName} danger />
              <Btn id={u.id} action="reset_avatar" label={a.resetAvatar} danger />
            </div>
          </li>
        ))}
      </ul>

      {rejected.length > 0 && (
        <section className="card opacity-80">
          <h2 className="mb-3 font-display text-base font-bold">{ap.rejectedList}</h2>
          <ul className="flex flex-col gap-2">
            {rejected.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-3">
                <Avatar url={u.avatar_url} preset={u.avatar_preset} size={36} />
                <span className="min-w-0 flex-1 truncate">
                  {u.display_name} <span className="text-sm text-muted">@{u.username}</span>
                </span>
                <Btn id={u.id} action="approve" label={ap.restore} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
