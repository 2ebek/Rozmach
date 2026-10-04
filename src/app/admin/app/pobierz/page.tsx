import Link from "next/link";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { AdminNav } from "@/components/AdminNav";
import { Icon, type IconName } from "@/components/Icon";
import { InstallApp } from "@/components/InstallApp";
import { PageHeader } from "@/components/PageHeader";
import { btnDarkCls, btnSecondaryCls } from "@/components/ui";
import { getRepo } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pobierz aplikację – panel administratora" };

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: "bell", title: "Powiadomienia push", text: "Każdy nowy pomysł od razu na telefonie lub w systemie – także przy zamkniętej aplikacji." },
  { icon: "check", title: "Decyzje w drodze", text: "Akceptuj, kieruj do weryfikacji albo odrzucaj fiszki i dodawaj komentarz dla autora." },
  { icon: "chat", title: "Rozmowa z autorem", text: "Odpowiadaj na pytania autorów bez otwierania pełnego panelu." },
  { icon: "refresh", title: "Zawsze aktualna", text: "Lista odświeża się sama, a licznik nowych pomysłów widać na ikonie aplikacji." },
];

const DESKTOP_STEPS = [
  "Otwórz tę stronę w Microsoft Edge lub Google Chrome (Windows, macOS, Linux).",
  "Kliknij „Zainstaluj na komputerze” powyżej albo ikonę instalacji w pasku adresu.",
  "Aplikacja Hub Admin pojawi się w menu Start, na pasku zadań lub w Docku i otworzy się we własnym oknie.",
];

const PHONE_STEPS: { system: string; steps: string }[] = [
  { system: "Android (Chrome)", steps: "Zeskanuj kod, zaloguj się i stuknij „Zainstaluj” albo menu ⋮ → „Zainstaluj aplikację”." },
  { system: "iPhone i iPad (Safari)", steps: "Zeskanuj kod, zaloguj się, stuknij „Udostępnij” → „Do ekranu początkowego”. Powiadomienia włączysz w otwartej aplikacji (iOS 16.4+)." },
];

/** Adres aplikacji na tym serwerze – do kodu QR dla telefonu. */
function appUrl(): string {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}/admin/app`;
}

export default async function Page() {
  const url = appUrl();
  const [events, qr] = await Promise.all([
    getRepo().listEvents(),
    QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#000f37", light: "#ffffff" } }),
  ]);
  const unread = events.filter((e) => !e.read).length;

  return (
    <>
      <PageHeader
        eyebrow="Panel administratora"
        title="Aplikacja Hub Admin"
        lead="Nowe pomysły, decyzje i rozmowy z autorami na telefonie i komputerze. Instaluje się prosto z przeglądarki – bez sklepu z aplikacjami i bez aktualizacji do pobierania."
      >
        <AdminNav unread={unread} />
      </PageHeader>

      <div className="space-y-10">
        <InstallApp />

        <div className="grid gap-6 lg:grid-cols-2">
          <section aria-labelledby="h-komputer" className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 sm:p-8" data-platform="komputer">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                <Icon name="monitor" className="h-6 w-6" />
              </span>
              <div>
                <h2 id="h-komputer" className="text-2xl font-black">
                  Na komputer
                </h2>
                <p className="text-sm text-slate-600">Windows · macOS · Linux</p>
              </div>
            </div>
            <ol className="mt-6 flex-1 space-y-4">
              {DESKTOP_STEPS.map((s, i) => (
                <li key={s} className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-900 text-sm font-bold text-white">{i + 1}</span>
                  <span className="pt-0.5 text-slate-800">{s}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 rounded-xl bg-mist p-4 text-sm text-slate-700">
              Na Macu w Safari: menu „Plik” → „Dodaj do Docka”. Firefox nie instaluje aplikacji internetowych – użyj Edge lub Chrome.
            </p>
          </section>

          <section aria-labelledby="h-telefon" className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 sm:p-8" data-platform="telefon">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-accent-ink">
                <Icon name="phone" className="h-6 w-6" />
              </span>
              <div>
                <h2 id="h-telefon" className="text-2xl font-black">
                  Na telefon
                </h2>
                <p className="text-sm text-slate-600">Android · iPhone · iPad</p>
              </div>
            </div>
            <div className="mt-6 flex flex-1 flex-wrap items-start gap-6">
              <figure className="shrink-0">
                <div
                  role="img"
                  aria-label={`Kod QR z adresem aplikacji: ${url}`}
                  className="h-44 w-44 rounded-2xl border border-slate-200 bg-white p-2 [&>svg]:h-full [&>svg]:w-full"
                  dangerouslySetInnerHTML={{ __html: qr }}
                  data-qr
                />
                <figcaption className="mt-2 max-w-[11rem] text-center text-xs text-slate-600">Zeskanuj aparatem telefonu</figcaption>
              </figure>
              <ul className="min-w-[14rem] flex-1 space-y-4">
                {PHONE_STEPS.map((p) => (
                  <li key={p.system}>
                    <p className="font-bold text-brand-900">{p.system}</p>
                    <p className="text-slate-800">{p.steps}</p>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-6 break-all rounded-xl bg-mist p-4 text-sm text-slate-700">
              Albo wpisz adres w przeglądarce telefonu: <strong className="text-brand-900">{url}</strong>
            </p>
          </section>
        </div>

        <section aria-labelledby="h-funkcje">
          <h2 id="h-funkcje" className="text-2xl font-black">
            Co potrafi aplikacja
          </h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <li key={f.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon name={f.icon} className="h-5 w-5" />
                </span>
                <p className="mt-3 font-black text-brand-900">{f.title}</p>
                <p className="mt-1 text-[0.95rem] text-slate-700">{f.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/app" className={btnDarkCls}>
            Otwórz aplikację w przeglądarce <Icon name="arrow" className="h-4 w-4" />
          </Link>
          <Link href="/admin" className={btnSecondaryCls}>
            Wróć do pulpitu
          </Link>
        </div>
        <p className="text-sm text-slate-600">
          Aplikacja to PWA (progresywna aplikacja internetowa): zajmuje kilkaset kilobajtów, aktualizuje się sama przy każdym uruchomieniu i korzysta z tego
          samego logowania co panel. Dostęp mają tylko zalogowani członkowie zespołu Hubu.
        </p>
      </div>
    </>
  );
}
