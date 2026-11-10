import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { fmt, getDictionary } from "@/lib/i18n";
import { getLanguages, isOnline, requireProfile, type Profile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { getGoatOfWeek } from "@/lib/leaderboard";

export const metadata: Metadata = { title: "Community" };

type Member = Profile & { user_languages: { language_code: string; level: string }[] };

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; lang?: string }>;
}) {
  await requireProfile();
  const { t } = await getDictionary();
  const { q = "", lang = "" } = await searchParams;

  const supabase = await createClient();
  const [{ data }, languages, goat] = await Promise.all([
    supabase
      .from("profiles")
      .select("*, user_languages(language_code, level)")
      .order("last_seen_at", { ascending: false }),
    getLanguages(),
    getGoatOfWeek(),
  ]);
  const all = ((data ?? []) as Member[]).filter((m) => !m.status || m.status === "active");
  const needle = q.trim().toLowerCase();
  const members = all.filter(
    (m) =>
      (!needle ||
        m.display_name.toLowerCase().includes(needle) ||
        m.username.toLowerCase().includes(needle)) &&
      (!lang || m.user_languages.some((ul) => ul.language_code === lang)),
  );
  const flagOf = (code: string) => languages.find((l) => l.code === code)?.flag ?? code;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="font-display text-xl font-bold sm:text-2xl">{t.community.title}</h1>
        <span className="text-sm text-muted">{fmt(t.community.members, { n: all.length })}</span>
      </div>

      <form className="flex flex-col gap-2 sm:flex-row">
        <input name="q" defaultValue={q} placeholder={t.community.search} className="input sm:flex-1" />
        <select name="lang" defaultValue={lang} className="input sm:w-56">
          <option value="">{t.community.allLanguages}</option>
          {languages
            .filter((l) => l.is_active)
            .map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.native_name}
              </option>
            ))}
        </select>
        <button className="btn-ghost">🔎</button>
      </form>

      {members.length === 0 ? (
        <p className="card text-muted">{t.community.empty}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {members.map((m) => {
            const online = isOnline(m.last_seen_at);
            return (
              <li key={m.id}>
                <Link
                  href={`/u/${m.username}`}
                  className="card flex items-center gap-4 p-4 transition hover:border-muted sm:p-4"
                >
                  <Avatar url={m.avatar_url} preset={m.avatar_preset} size={56} online={online} alt={m.display_name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">
                      {m.display_name}
                      {goat?.user_id === m.id && <span title={t.leaderboard.goatOfWeek}> 👑</span>}
                    </p>
                    <p className="truncate text-sm text-muted">
                      @{m.username}
                      {online && <span className="ml-2 text-mint">● {t.community.online}</span>}
                    </p>
                    <p className="mt-1 flex flex-wrap gap-1">
                      {m.user_languages.map((ul) => (
                        <span key={ul.language_code} className="chip">
                          {flagOf(ul.language_code)} {ul.level}
                        </span>
                      ))}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
