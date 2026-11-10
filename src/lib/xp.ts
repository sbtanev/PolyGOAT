import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export const XP = {
  lesson: 10,
  lessonPerfectBonus: 5,
  practice: 5,
  review: 1,
  dialogue: 5,
  reading: 5,
} as const;

export async function awardXp(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  reason: string,
  languageCode?: string | null,
  ref?: string | null,
) {
  if (amount <= 0) return;
  await supabase
    .from("xp_events")
    .insert({ user_id: userId, amount, reason, language_code: languageCode ?? null, ref: ref ?? null });
}

const TZ = "Europe/Helsinki";

/** "2026-11-10" in the group's time zone. */
export function localDay(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

function addDays(day: string, n: number) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** ISO week key ("2026-W46"): one streak freeze is available per week. */
function weekKey(day: string) {
  const d = new Date(`${day}T12:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((d.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${d.getUTCFullYear()}-W${week}`;
}

/**
 * Streak = consecutive active days ending today (or yesterday, if today isn't done yet).
 * One missed day per week is forgiven automatically: the weekly streak freeze.
 */
export function computeStreak(activeDays: Set<string>, today = localDay(new Date())) {
  let day = activeDays.has(today) ? today : addDays(today, -1);
  let streak = 0;
  const freezesUsed = new Set<string>();
  let frozenDays: string[] = [];
  for (let i = 0; i < 1000; i++) {
    if (activeDays.has(day)) {
      streak++;
    } else {
      const wk = weekKey(day);
      // a freeze only bridges a gap between two active days
      if (!freezesUsed.has(wk) && activeDays.has(addDays(day, -1)) && streak > 0) {
        freezesUsed.add(wk);
        frozenDays = [...frozenDays, day];
      } else break;
    }
    day = addDays(day, -1);
  }
  const freezeUsedThisWeek = freezesUsed.has(weekKey(today));
  return { streak, doneToday: activeDays.has(today), freezeUsedThisWeek, frozenDays };
}

export async function getStats(supabase: SupabaseClient, userId: string) {
  const since = new Date(Date.now() - 400 * 86400000).toISOString();
  const { data } = await supabase
    .from("xp_events")
    .select("amount, created_at")
    .eq("user_id", userId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(20000);
  const rows = data ?? [];
  const days = new Set(rows.map((r) => localDay(new Date(r.created_at as string))));
  const today = localDay(new Date());
  const xpToday = rows
    .filter((r) => localDay(new Date(r.created_at as string)) === today)
    .reduce((a, r) => a + (r.amount as number), 0);
  const { count } = await supabase
    .from("xp_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  const { data: total } = await supabase.rpc("total_xp", { p_user: userId });
  return { ...computeStreak(days, today), xpToday, events: count ?? 0, totalXp: (total as number | null) ?? 0 };
}
