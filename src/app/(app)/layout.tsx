import Link from "next/link";
import { LocaleSwitcher, LogoLink } from "@/components/Brand";
import { Avatar } from "@/components/Avatar";
import { NavLinks } from "./NavLinks";
import { signOut } from "../actions";
import { getDictionary } from "@/lib/i18n";
import { requireProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const { t, locale } = await getDictionary();

  const supabase = await createClient();
  await supabase.rpc("touch_last_seen");

  const links = [
    { href: "/home", label: t.nav.home, icon: "🏔️" },
    { href: "/community", label: t.nav.community, icon: "🐐" },
    { href: "/profile", label: t.nav.profile, icon: "🎒" },
    ...(profile.role === "admin" ? [{ href: "/admin/invites", label: t.nav.admin, icon: "🛠️" }] : []),
  ];

  return (
    <div className="min-h-dvh pb-24 sm:pb-8">
      <header className="sticky top-0 z-20 border-b border-line/60 bg-night/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <LogoLink href="/home" />
          <nav className="hidden sm:block">
            <NavLinks links={links} variant="top" />
          </nav>
          <div className="flex items-center gap-2">
            <LocaleSwitcher locale={locale} />
            <Link href="/profile" aria-label={t.nav.profile}>
              <Avatar url={profile.avatar_url} preset={profile.avatar_preset} size={38} />
            </Link>
            <form action={signOut} className="hidden sm:block">
              <button className="chip min-h-9 px-3 hover:border-muted">{t.nav.signOut}</button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line/60 bg-night/95 backdrop-blur sm:hidden">
        <NavLinks links={links} variant="bottom" />
      </nav>
    </div>
  );
}
