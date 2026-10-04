import type { Metadata, Viewport } from "next";

// Aplikacja administratora (PWA): instalowalna na telefonie i komputerze, zakres /admin/app.
// Dostęp chroni istniejący middleware (/admin/*). Strona pobierania (/admin/app/pobierz) leży w zakresie
// aplikacji, bo przeglądarki proponują instalację tylko na stronach z tego zakresu.
export const metadata: Metadata = {
  title: "Hub Admin – nowe pomysły",
  manifest: "/admin-app.webmanifest",
  appleWebApp: { capable: true, title: "Hub Admin", statusBarStyle: "default" },
  icons: { icon: "/icons/admin-192.png", apple: "/icons/admin-192.png" },
};

export const viewport: Viewport = { themeColor: "#000f37" };

// Przeglądarka wysyła „beforeinstallprompt” raz, często zanim React podłączy komponenty –
// przechwytujemy je od razu w HTML i przekazujemy do InstallApp.
const CAPTURE_INSTALL_PROMPT = `window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__hubInstallPrompt=e;window.dispatchEvent(new Event("hub-install-ready"));});`;

export default function AdminAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: CAPTURE_INSTALL_PROMPT }} />
      {children}
    </>
  );
}
