import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { Badge, SectionTitle } from "@/components/ui";

export const metadata = { title: "O projekcie – Hub Innowacji" };

const MODULES = [
  { no: "I", name: "Matchmaking społeczny", req: "obowiązkowy", href: "/dopasuj", what: "Opis problemu → ranking innowacji z wyjaśnieniem (wspólne słowa), podobne przypadki innych mieszkańców, informacje o wyzwaniu." },
  { no: "II", name: "Zasobnik wiedzy", req: "", href: "/zasobnik", what: "Wyzwania z prawdziwymi wskaźnikami z Obserwatora Statystyk Społecznych ROPS, Biblioteka Innowacji z filtrem i miejscem na filmy, materiały. Trendy potrzeb tylko dla administratora." },
  { no: "III", name: "Kreator pomysłów", req: "", href: "/kreator", what: "Fiszka z kodem zgłoszenia i danymi IOSS dla gminy do diagnozy problemu, Canva innowacji, asystent kreatora, generator wniosków dopasowany do pytań każdego naboru." },
  { no: "IV", name: "Tester innowacji", req: "", href: "/tester", what: "Zgłoszenie do testów, ocena gwiazdkowa, uwagi i propozycje usprawnień." },
  { no: "V", name: "Platforma aktywnej komunikacji", req: "", href: "/komunikacja", what: "Forum z rolami (ROPS, mentorzy, JST, NGO, mieszkańcy), giełda partnerstw, wątki zgłoszeń admin ↔ autor." },
  { no: "VI", name: "Panel administratora", req: "", href: "/admin", what: "Logowanie, powiadomienia, moderacja fiszek i wniosków z odpowiedzią do autora, edycja wiedzy, otwieranie naborów." },
  { no: "VII", name: "Middleman Innowacji", req: "", href: "/middleman", what: "Asystent dopasowujący innowację do formy usługi dla konkretnej instytucji." },
];

const API = [
  { method: "GET", path: "/api/innovations", desc: "Opublikowane innowacje (Biblioteka)" },
  { method: "GET", path: "/api/challenges", desc: "Wyzwania regionu ze wskaźnikami" },
  { method: "GET", path: "/api/nabory", desc: "Nabory i ich status" },
  { method: "GET", path: "/api/ioss?unit=…&area=…", desc: "Wskaźniki IOSS dla gminy lub powiatu (z porównaniem i źródłem)" },
  { method: "POST", path: "/api/match", desc: "Matchmaking: { text, area? } → propozycje, podobne przypadki" },
  { method: "GET", path: "/api/status?code=…", desc: "Status zgłoszenia po kodzie" },
];

const COSTS = [
  { item: "Hosting aplikacji (2 instancje kontenerowe, chmura w UE)", cost: "300–600 zł" },
  { item: "Baza PostgreSQL zarządzana + kopie zapasowe", cost: "250–500 zł" },
  { item: "Model językowy i wyszukiwanie semantyczne (ok. 5 tys. zapytań/mies.)", cost: "100–400 zł" },
  { item: "Domena, certyfikat, poczta transakcyjna, monitoring", cost: "50–150 zł" },
];

const STEPS_FLOW = [
  { t: "Mieszkaniec / JST / NGO", d: "opisuje problem albo wysyła fiszkę" },
  { t: "Matchmaking i zapis", d: "propozycje + kod zgłoszenia" },
  { t: "Powiadomienie", d: "panel admina + webhook (Teams, e-mail, system grantowy)" },
  { t: "Odpowiedź", d: "admin odpisuje w wątku – autor widzi ją po kodzie" },
];

export default function Page() {
  return (
    <>
      <PageHeader
        eyebrow="O projekcie"
        title="Hub Innowacji Społecznych Małopolski"
        lead="Prototyp „cyfrowego serca” Małopolskiego Hubu Innowacji Społecznych – platformy, która łączy zgłaszane problemy z gotowymi i nowo powstającymi rozwiązaniami. Przygotowany na hackathon dla ROPS w Krakowie."
      />

      <div className="space-y-20">
        <section aria-labelledby="h-opis" className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <SectionTitle id="h-opis" kicker="Nazwa i opis rozwiązania">
              Krótko o rozwiązaniu
            </SectionTitle>
            <div className="space-y-4 text-lg text-slate-800">
              <p>
                W Małopolsce powstało blisko 200 innowacji społecznych, ale gminy, organizacje i mieszkańcy często o nich nie wiedzą. Hub zamienia
                tę wiedzę w usługę: wystarczy opisać problem własnymi słowami, a platforma podpowie sprawdzone rozwiązania i ludzi, którzy je stworzyli.
              </p>
              <p>
                Każde zgłoszenie od razu trafia do zespołu ROPS jako powiadomienie, a autor – bez zakładania konta i bez podawania danych osobowych –
                śledzi status i rozmawia z zespołem dzięki kodowi zgłoszenia.
              </p>
            </div>
          </div>
          <div className="rounded-3xl bg-brand-900 p-8 text-white">
            <h2 className="text-xl font-black !text-white">Ścieżka zgłoszenia</h2>
            <ol className="mt-5 space-y-4">
              {STEPS_FLOW.map((s, i) => (
                <li key={s.t} className="flex gap-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white font-black text-brand-900">{i + 1}</span>
                  <span>
                    <span className="block font-bold">{s.t}</span>
                    <span className="text-slate-300">{s.d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="h-moduly">
          <SectionTitle id="h-moduly" kicker="Zakres prototypu">
            Moduły z wyzwania
          </SectionTitle>
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
            {MODULES.map((m) => (
              <li key={m.no} className="grid gap-3 bg-white p-5 sm:grid-cols-[4rem_15rem_1fr] sm:items-start">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 font-black text-brand-700">{m.no}</span>
                <span>
                  <Link href={m.href} className="font-black text-brand-900 hover:text-brand-700 hover:underline">
                    {m.name}
                  </Link>
                  <span className="mt-1 flex gap-2">
                    <Badge className="bg-emerald-100 text-emerald-900">działa</Badge>
                    {m.req && <Badge className="bg-rose-50 text-accent">{m.req}</Badge>}
                  </span>
                </span>
                <span className="text-slate-700">{m.what}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="h-arch" className="grid gap-8 lg:grid-cols-2">
          <div>
            <SectionTitle id="h-arch" kicker="Architektura">
              Gotowe do rozbudowy
            </SectionTitle>
            <ul className="space-y-3 text-slate-800">
              {[
                ["Wymienne moduły", "Dane, dopasowanie i asystent to osobne interfejsy. Prototyp działa w pamięci i lokalnie; produkcja podmienia je na PostgreSQL, wyszukiwanie semantyczne i model językowy – bez zmian w interfejsie."],
                ["Matchmaking bez czarnej skrzynki", "TF-IDF z obsługą polskiej odmiany i premią za pokrycie całego opisu. Zawsze pokazuje, dlaczego wybrał daną innowację."],
                ["Automatyzacja", "Każde zdarzenie (fiszka, wniosek, opinia, zmiana naboru) trafia do powiadomień administratora i na webhook (NOTIFY_WEBHOOK_URL)."],
                ["Skalowalność", "Aplikacja bezstanowa (Next.js) – kolejne instancje za load balancerem; dane w jednej bazie dla całego województwa."],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-1 text-emerald-700">
                    <Icon name="check" className="h-5 w-5" />
                  </span>
                  <span>
                    <strong className="text-brand-900">{t}.</strong> {d}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionTitle kicker="Bezpieczeństwo i dostępność">Zaufanie od pierwszego dnia</SectionTitle>
            <ul className="space-y-3 text-slate-800">
              {[
                ["Minimum danych", "Zgłoszenia nie wymagają danych osobowych – autor używa kodu zgłoszenia zamiast konta."],
                ["Ochrona panelu", "Panel i API administratora tylko po zalogowaniu (ciasteczko httpOnly); docelowo SSO urzędu."],
                ["Walidacja i limity", "Każde wejście walidowane po stronie serwera, limit zgłoszeń na adres IP, nagłówki bezpieczeństwa."],
                ["WCAG 2.1 AA", "Kontrasty AA, pełna obsługa klawiaturą, czytniki ekranu (aria-live, etykiety), powiększanie tekstu i wersja kontrastowa."],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-1 text-emerald-700">
                    <Icon name="check" className="h-5 w-5" />
                  </span>
                  <span>
                    <strong className="text-brand-900">{t}.</strong> {d}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="api" aria-labelledby="h-api" className="scroll-mt-6">
          <SectionTitle id="h-api" kicker="Integracje">
            Otwarte API
          </SectionTitle>
          <p className="mb-5 max-w-3xl text-slate-700">
            Dane Hubu mogą zasilać portale gmin, system grantowy czy Mapę Wyzwań. Odpowiedzi w formacie JSON; zdarzenia wysyłane są na webhook.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[36rem] text-left">
              <caption className="sr-only">Publiczne punkty API</caption>
              <thead className="bg-mist text-sm uppercase tracking-wide text-slate-700">
                <tr>
                  <th scope="col" className="px-5 py-3">Metoda</th>
                  <th scope="col" className="px-5 py-3">Adres</th>
                  <th scope="col" className="px-5 py-3">Opis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {API.map((a) => (
                  <tr key={a.path}>
                    <td className="px-5 py-3">
                      <Badge className={a.method === "GET" ? "bg-emerald-100 text-emerald-900" : "bg-brand-50 text-brand-700"}>{a.method}</Badge>
                    </td>
                    <td className="px-5 py-3 font-mono text-sm text-brand-900">{a.path}</td>
                    <td className="px-5 py-3 text-slate-700">{a.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="h-koszty" className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <SectionTitle id="h-koszty" kicker="Wymagania formalne">
              Przewidywany koszt utrzymania
            </SectionTitle>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-left">
                <caption className="sr-only">Szacunkowe miesięczne koszty infrastruktury</caption>
                <thead className="bg-mist text-sm uppercase tracking-wide text-slate-700">
                  <tr>
                    <th scope="col" className="px-5 py-3">Pozycja</th>
                    <th scope="col" className="px-5 py-3 text-right">Miesięcznie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {COSTS.map((c) => (
                    <tr key={c.item}>
                      <td className="px-5 py-3 text-slate-800">{c.item}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-right font-bold text-brand-900">{c.cost}</td>
                    </tr>
                  ))}
                  <tr className="bg-brand-50">
                    <th scope="row" className="px-5 py-3 font-black text-brand-900">Razem infrastruktura</th>
                    <td className="whitespace-nowrap px-5 py-3 text-right text-lg font-black text-brand-900">ok. 700–1 650 zł</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-slate-600">Szacunek orientacyjny (ceny netto, 2026) – do weryfikacji przy wyborze dostawcy i skali ruchu.</p>
          </div>
          <div className="rounded-3xl bg-brand-50 p-8">
            <h3 className="text-xl font-black text-brand-900">Niezbędne zasoby</h3>
            <ul className="mt-4 space-y-3 text-slate-800">
              <li>
                <strong>Redakcja treści (ROPS):</strong> ok. ¼ etatu – moderacja fiszek, odpowiedzi autorom, aktualizacja Biblioteki w panelu; wskaźniki odświeżane skryptem z Obserwatora Statystyk Społecznych ROPS.
              </li>
              <li>
                <strong>Mentorzy:</strong> dyżury na forum w ramach istniejącej sieci ekspertów Hubu.
              </li>
              <li>
                <strong>Wsparcie techniczne:</strong> ok. 10–20 godzin miesięcznie (aktualizacje, kopie, monitoring) – firma zewnętrzna lub dział IT.
              </li>
              <li>
                <strong>Bez licencji:</strong> oprogramowanie oparte na otwartych technologiach (Next.js, PostgreSQL).
              </li>
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}
