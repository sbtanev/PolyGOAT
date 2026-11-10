import type { Metadata, Viewport } from "next";
import "@fontsource-variable/nunito";
import "@fontsource-variable/unbounded";
import { getLocale } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "PolyGOAT", template: "%s · PolyGOAT" },
  description: "Learn languages with friends. Real conversations. Become the GOAT.",
  applicationName: "PolyGOAT",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#14111f",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body className="backdrop min-h-dvh">{children}</body>
    </html>
  );
}
