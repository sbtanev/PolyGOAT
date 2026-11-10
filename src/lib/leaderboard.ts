import "server-only";
import { cache } from "react";
import { createClient } from "./supabase/server";

export type LeaderRow = {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  avatar_preset: string;
  xp: number;
};

export async function getLeaderboard(weeksAgo = 0): Promise<LeaderRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("weekly_leaderboard", { p_weeks_ago: weeksAgo });
  return ((data ?? []) as LeaderRow[]).map((r) => ({ ...r, xp: Number(r.xp) }));
}

/** Winner of last week (needs at least some XP), shown with a crown everywhere. */
export const getGoatOfWeek = cache(async (): Promise<LeaderRow | null> => {
  const rows = await getLeaderboard(1);
  return rows[0] && rows[0].xp > 0 ? rows[0] : null;
});
