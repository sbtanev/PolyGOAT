import { Avatar } from "@/components/Avatar";
import { Goat } from "@/components/Goat";
import { fmt, getDictionary, pickName } from "@/lib/i18n";
import { getLanguages, isOnline, requireProfile, type Profile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

type Member = Profile & { user_languages: { language_code: string; level: string }[] };

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  await requireProfile();
  const { t, locale } = await getDictionary();
  const { username } = await params;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*, user_languages(language_code, level)")
    .eq("username", decodeURIComponent(username))
    .maybeSingle();
  const member = data as Member | null;

  if (!member) {
    return (
      <div className="card flex flex-col items-center gap-3 py-10 text-center">
        <Goat size={96} />
        <p className="text-muted">{t.publicProfile.notFound}</p>
      </div>
    );
  }

  const languages = await getLanguages();
  const since = new Date(member.created_at).toLocaleDateString(locale === "bg" ? "bg-BG" : "en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-5">
      <section className="card flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
        <Avatar
          url={member.avatar_url}
          preset={member.avatar_preset}
          size={112}
          online={isOnline(member.last_seen_at)}
          alt={member.display_name}
        />
        <div className="min-w-0 flex-1 sm:pl-3">
          <h1 className="font-display text-2xl font-bold break-words">{member.display_name}</h1>
          <p className="text-muted">@{member.username}</p>
          {member.bio && <p className="mt-3 italic">“{member.bio}”</p>}
          <p className="mt-2 text-xs text-muted">{fmt(t.publicProfile.memberSince, { date: since })}</p>
        </div>
        <button className="btn-ghost" disabled title={t.publicProfile.duelsSoon}>
          ⚔️ {t.publicProfile.challenge}
        </button>
      </section>

      <section className="card">
        <h2 className="mb-3 font-display text-lg font-bold">{t.publicProfile.learning}</h2>
        <ul className="flex flex-wrap gap-3">
          {member.user_languages.map((ul) => {
            const lang = languages.find((l) => l.code === ul.language_code);
            return (
              <li key={ul.language_code} className="flex items-center gap-2 rounded-2xl bg-panel-2 px-4 py-2">
                <Goat accessory={lang?.mascot_accessory} size={40} />
                <span className="font-bold">
                  {lang?.flag} {pickName(lang?.name, locale)}
                </span>
                <span className="chip">{ul.level}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
