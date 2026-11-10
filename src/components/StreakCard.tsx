import type { Dictionary } from "@/lib/i18n/en";

export function StreakCard({
  stats,
  t,
}: {
  stats: { streak: number; doneToday: boolean; freezeUsedThisWeek: boolean; xpToday: number; totalXp: number };
  t: Dictionary["stats"];
}) {
  return (
    <section className="grid grid-cols-3 gap-3">
      <div className={`card flex flex-col items-center gap-1 p-4 text-center sm:p-4 ${stats.doneToday ? "border-gold/60" : ""}`}>
        <span className="text-3xl" aria-hidden>
          {stats.streak > 0 ? "🔥" : "🌱"}
        </span>
        <span className="font-display text-2xl font-bold">{stats.streak}</span>
        <span className="text-xs text-muted">{stats.streak > 0 ? t.streak : t.streakNone}</span>
      </div>
      <div className="card flex flex-col items-center gap-1 p-4 text-center sm:p-4">
        <span className="text-3xl" aria-hidden>
          ⚡
        </span>
        <span className="font-display text-2xl font-bold">{stats.xpToday}</span>
        <span className="text-xs text-muted">{t.xpToday}</span>
      </div>
      <div className="card flex flex-col items-center gap-1 p-4 text-center sm:p-4">
        <span className="text-3xl" aria-hidden>
          🏔️
        </span>
        <span className="font-display text-2xl font-bold">{stats.totalXp}</span>
        <span className="text-xs text-muted">{t.totalXp}</span>
      </div>
      <p className="col-span-3 text-center text-xs text-muted">
        {stats.doneToday ? t.doneToday : t.notToday} · {stats.freezeUsedThisWeek ? t.freezeUsed : t.freezeReady}
      </p>
    </section>
  );
}
