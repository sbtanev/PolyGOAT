import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { AvatarUpload } from "./AvatarUpload";
import { ProfileForm } from "./ProfileForm";
import { RemoveLanguageButton } from "./RemoveLanguageButton";
import { signOut } from "../../actions";
import { getDictionary, pickName } from "@/lib/i18n";
import { getBaseLanguages, getLanguages, getUserLanguages, requireProfile } from "@/lib/data";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const profile = await requireProfile();
  const { t, locale } = await getDictionary();
  const [mine, languages, bases] = await Promise.all([
    getUserLanguages(profile.id),
    getLanguages(),
    getBaseLanguages(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <section className="card">
        <div className="mb-6 flex flex-wrap items-center gap-5">
          <Avatar url={profile.avatar_url} preset={profile.avatar_preset} size={96} alt={profile.display_name} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl font-bold">{profile.display_name}</h1>
            <Link href={`/u/${profile.username}`} className="text-sm text-muted hover:text-ink">
              @{profile.username}
            </Link>
          </div>
          <AvatarUpload
            userId={profile.id}
            labels={{
              upload: t.profile.upload,
              uploading: t.profile.uploading,
              hint: t.profile.uploadHint,
              tooBig: t.profile.fileTooBig,
              failed: t.profile.uploadFailed,
            }}
          />
        </div>
        <ProfileForm profile={profile} t={t.profile} authT={t.auth} />
      </section>

      <section className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">{t.profile.languages}</h2>
          <Link href="/onboarding" className="chip min-h-9 px-3 hover:border-muted">
            + {t.nav.addLanguage}
          </Link>
        </div>
        <ul className="flex flex-col gap-2">
          {mine.map((ul) => {
            const lang = languages.find((l) => l.code === ul.language_code);
            const base = bases.find((b) => b.code === ul.source_language);
            return (
              <li
                key={ul.language_code}
                className="flex items-center justify-between gap-3 rounded-2xl bg-panel-2 px-4 py-3"
              >
                <span>
                  <span className="font-bold">
                    {lang?.flag} {pickName(lang?.name, locale)}
                  </span>{" "}
                  <span className="text-sm text-muted">
                    {ul.level} · {t.home.from} {base?.flag}
                  </span>
                </span>
                <RemoveLanguageButton
                  language={ul.language_code}
                  label={t.profile.remove}
                  confirmText={t.profile.confirmRemove}
                />
              </li>
            );
          })}
        </ul>
      </section>

      <form action={signOut} className="sm:hidden">
        <button className="btn-ghost w-full">{t.nav.signOut}</button>
      </form>
    </div>
  );
}
