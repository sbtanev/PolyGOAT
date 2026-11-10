import Link from "next/link";
import { getDictionary } from "@/lib/i18n";
import { requireProfile } from "@/lib/data";

export default async function AdminHome() {
  const profile = await requireProfile();
  const { t } = await getDictionary();
  if (profile.role !== "admin") return <p className="card text-muted">{t.admin.onlyAdmins}</p>;

  const links = [
    { href: "/admin/invites", icon: "🎟️", title: t.adminHome.invites, desc: t.adminHome.invitesDesc },
    { href: "/admin/packs", icon: "📦", title: t.adminHome.packs, desc: t.adminHome.packsDesc },
    { href: "/admin/content", icon: "✏️", title: t.adminContent.content, desc: t.adminContent.contentDesc },
    { href: "/admin/users", icon: "👥", title: t.adminContent.users, desc: t.adminContent.usersDesc },
    { href: "/admin/stats", icon: "📊", title: t.adminContent.statsTitle, desc: t.adminContent.statsDesc },
  ];
  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-xl font-bold sm:text-2xl">{t.adminHome.title}</h1>
      <ul className="grid gap-3 sm:grid-cols-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="card flex items-center gap-4 transition hover:border-muted">
              <span className="text-3xl" aria-hidden>
                {l.icon}
              </span>
              <span>
                <span className="block font-bold">{l.title}</span>
                <span className="block text-sm text-muted">{l.desc}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
