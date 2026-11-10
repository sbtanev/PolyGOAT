import type { Metadata } from "next";
import { AuthShell } from "../AuthShell";
import { LoginForm } from "./LoginForm";
import { getDictionary } from "@/lib/i18n";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { t, locale } = await getDictionary();
  const { next } = await searchParams;
  return (
    <AuthShell title={t.auth.loginTitle} locale={locale} accessory="beanie">
      <LoginForm t={t.auth} next={next ?? "/home"} />
    </AuthShell>
  );
}
