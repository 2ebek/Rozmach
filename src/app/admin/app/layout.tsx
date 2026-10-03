import type { Metadata, Viewport } from "next";

// Aplikacja administratora (PWA): instalowalna na telefonie i komputerze, zakres /admin/app.
// Dostęp chroni istniejący middleware (/admin/*).
export const metadata: Metadata = {
  title: "Hub Admin – nowe pomysły",
  manifest: "/admin-app.webmanifest",
  appleWebApp: { capable: true, title: "Hub Admin", statusBarStyle: "default" },
  icons: { icon: "/icons/admin-192.png", apple: "/icons/admin-192.png" },
};

export const viewport: Viewport = { themeColor: "#000f37" };

export default function AdminAppLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-3xl py-6">{children}</div>;
}
