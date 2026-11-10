import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Goat } from "@/components/Goat";
import { getDictionary } from "@/lib/i18n";
import { requireProfile } from "@/lib/data";
import { getGoatOfWeek, getLeaderboard } from "@/lib/leaderboard";

export const metadata: Metadata = { title: "Leaderboard" };

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const profile = await requireProfile();
  const { t } = await getDictionary();
  const { week } = await searchParams;
  const weeksAgo = week === "last" ? 1 : 0;
  const [rows, goat] = await Promise.all([getLeaderboard(weeksAgo), getGoatOfWeek()]);
  const active = rows.filter((r) => r.xp > 0);
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-xl font-bold sm:text-2xl">🏆 {t.leaderboard.title}</h1>

      {goat && (
        <Link href={`/u/${goat.username}`} className="card flex items-center gap-4 border-gold/60 bg-gold/10">
          <Goat accessory="crown" size={72} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-gold">{t.leaderboard.goatOfWeek}</p>
            <p className="truncate font-display text-lg font-bold">{goat.display_name}</p>
            <p className="text-sm text-muted">
              {t.leaderboard.goatOfWeekHint} · {goat.xp} XP
            </p>
          </div>
          <Avatar url={goat.avatar_url} preset={goat.avatar_preset} size={56} />
        </Link>
      )}

      <div className="flex gap-2">
        <Link href="/leaderboard" className={`chip min-h-10 px-4 text-sm ${weeksAgo === 0 ? "border-gold text-gold" : ""}`}>
          {t.leaderboard.thisWeek}
        </Link>
        <Link href="/leaderboard?week=last" className={`chip min-h-10 px-4 text-sm ${weeksAgo === 1 ? "border-gold text-gold" : ""}`}>
          {t.leaderboard.lastWeek}
        </Link>
      </div>

      {active.length === 0 ? (
        <p className="card text-muted">{t.leaderboard.nobody}</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {active.map((r, i) => {
            const me = r.user_id === profile.id;
            return (
              <li key={r.user_id}>
                <Link
                  href={`/u/${r.username}`}
                  className={`card flex items-center gap-3 p-3 transition hover:border-muted sm:p-4 ${me ? "border-mint/60" : ""}`}
                >
                  <span className="w-8 text-center font-display text-lg font-bold">{medals[i] ?? i + 1}</span>
                  <Avatar url={r.avatar_url} preset={r.avatar_preset} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">
                      {r.display_name}
                      {goat?.user_id === r.user_id && " 👑"}
                      {me && <span className="ml-2 text-xs text-mint">({t.leaderboard.you})</span>}
                    </span>
                    <span className="block text-sm text-muted">@{r.username}</span>
                  </span>
                  <span className="font-display font-bold text-gold">{r.xp} XP</span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
