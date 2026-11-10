"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { href: string; label: string; icon: string };

export function NavLinks({ links, variant }: { links: NavLink[]; variant: "top" | "bottom" }) {
  const path = usePathname();
  const isActive = (href: string) => path === href || path.startsWith(`${href}/`);

  if (variant === "top") {
    return (
      <ul className="flex gap-1">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                isActive(l.href) ? "bg-panel-2 text-gold" : "text-muted hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="mx-auto flex max-w-md justify-around px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
      {links.map((l) => (
        <li key={l.href}>
          <Link
            href={l.href}
            className={`flex min-w-16 flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-xs font-bold ${
              isActive(l.href) ? "text-gold" : "text-muted"
            }`}
          >
            <span className="text-xl" aria-hidden>
              {l.icon}
            </span>
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
