import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { requireProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { tr } from "@/lib/tr";
import { daysAgoIso } from "@/lib/time";

export const metadata: Metadata = { title: "Statistics" };

export default async function StatsPage() {
  const me = await requireProfile();
  const { t, locale } = await getDictionary();
  if (me.role !== "admin") return <p className="card text-muted">{t.admin.onlyAdmins}</p>;
  const a = t.adminContent;

  const supabase = await createClient();
  const since = daysAgoIso(7);
  const [{ data: profiles }, { data: xp }, { count: reviews }, { data: mistakes }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, username"),
    supabase.from("xp_events").select("user_id, amount").gte("created_at", since).limit(50000),
    supabase.from("review_log").select("id", { count: "exact", head: true }).gte("reviewed_at", since),
    supabase.from("mistakes").select("item_id, count, items(text, language_code, translations)").limit(5000),
  ]);

  const xpByUser = new Map<string, number>();
  for (const e of xp ?? []) xpByUser.set(e.user_id as string, (xpByUser.get(e.user_id as string) ?? 0) + (e.amount as number));
  const activity = (profiles ?? [])
    .map((p) => ({ ...p, xp: xpByUser.get(p.id as string) ?? 0 }))
    .sort((x, y) => y.xp - x.xp);
  const maxXp = Math.max(1, ...activity.map((r) => r.xp));

  type M = { item_id: string; count: number; items: { text: string; language_code: string; translations: Record<string, string> } | null };
  const missed = new Map<string, { text: string; lang: string; tr: string; count: number; people: number }>();
  for (const m of (mistakes ?? []) as unknown as M[]) {
    const cur = missed.get(m.item_id) ?? {
      text: m.items?.text ?? m.item_id,
      lang: m.items?.language_code ?? "",
      tr: tr(m.items?.translations, locale),
      count: 0,
      people: 0,
    };
    cur.count += m.count;
    cur.people += 1;
    missed.set(m.item_id, cur);
  }
  const topMissed = [...missed.values()].sort((x, y) => y.count - x.count).slice(0, 20);

  const tiles = [
    [a.members, profiles?.length ?? 0],
    [a.activeWeek, activity.filter((r) => r.xp > 0).length],
    [a.reviews7, reviews ?? 0],
  ] as const;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-xl font-bold sm:text-2xl">📊 {a.statsTitle}</h1>
      <div className="grid grid-cols-3 gap-3">
        {tiles.map(([label, value]) => (
          <div key={label} className="card p-4 text-center sm:p-4">
            <p className="font-display text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>

      <section className="card">
        <h2 className="mb-3 font-display text-lg font-bold">{a.activity7}</h2>
        <ul className="flex flex-col gap-2">
          {activity.map((r) => (
            <li key={r.id as string} className="grid grid-cols-[10rem_1fr_3.5rem] items-center gap-3 text-sm">
              <span className="truncate">{r.display_name as string}</span>
              <span className="h-3 overflow-hidden rounded-full bg-panel-2">
                <span className="block h-full rounded-full bg-gold" style={{ width: `${(r.xp / maxXp) * 100}%` }} />
              </span>
              <span className="text-right font-bold">{r.xp}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="mb-3 font-display text-lg font-bold">{a.mostMissed}</h2>
        {topMissed.length === 0 ? (
          <p className="text-sm text-muted">—</p>
        ) : (
          <ol className="flex flex-col gap-1 text-sm">
            {topMissed.map((m, i) => (
              <li key={i} className="flex justify-between gap-3 rounded-xl bg-panel-2 px-3 py-2">
                <span>
                  <span className="font-bold">{m.text}</span> <span className="text-muted">· {m.tr}</span>{" "}
                  <span className="chip">{m.lang}</span>
                </span>
                <span className="shrink-0 text-muted">
                  ✗ {m.count} · 👥 {m.people}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
