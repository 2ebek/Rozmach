import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { Inspirations } from "@/components/home/Inspirations";
import { NeedForm } from "@/components/home/NeedForm";
import { getRepo } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Strona główna wg makiety „ROZMACH – strona główna” (nowy_wyglad/). Przykłady interfejsu są oznaczone jako demonstracyjne. */

const PHOTOS = [
  { src: "/img/hero-1.jpg", cls: "-rotate-[14deg] translate-y-14 hidden md:block" },
  { src: "/img/hero-2.jpg", cls: "-rotate-[6deg] translate-y-4" },
  { src: "/img/hero-3.jpg", cls: "rotate-0 -translate-y-2 z-10" },
  { src: "/img/hero-4.jpg", cls: "rotate-[6deg] translate-y-5" },
  { src: "/img/hero-5.jpg", cls: "rotate-[13deg] translate-y-16 hidden md:block" },
];

const STEPS = [
  { title: "Ty mówisz, co uwiera", text: "Opisz problem normalnymi słowami — tak, jak opowiedziałbyś sąsiadowi." },
  {
    title: "AI szuka bratniej duszy i gotowych rozwiązań",
    text: "Rozmach szuka w wiedzy Hubu pomysłów, które można dopasować do Twojej okolicy. Pokazuje, dlaczego je poleca, skąd pochodzą i co warto sprawdzić.",
  },
  { title: "Hub daje paliwo i rusztowanie", text: "Zespół Hubu pomaga zbudować prototyp, uporządkować formalności i poszukać finansowania na testy." },
  { title: "Idziemy z tym w region", text: "Jeśli pomysł działa, pomagamy przenieść go do kolejnych miejsc w regionie i podzielić się wiedzą." },
];

const AI_DEMO = [
  {
    title: "Sąsiedzki krąg spotkań",
    why: "Pasuje do potrzeby regularnego kontaktu. Małe spotkania można organizować w przestrzeni blisko mieszkańców.",
    check: "dostępność lokalu i osoba prowadząca spotkania.",
  },
  {
    title: "Mobilny klub seniora",
    why: "Odpowiada na barierę dojazdu: aktywności mogą docierać do osób, które nie odwiedzają domu kultury.",
    check: "zasoby zespołu i potrzeby osób o ograniczonej mobilności.",
  },
];

const HUB_FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: "search", title: "Szukaj po znaczeniu", text: "Znajdź materiały, nawet gdy używasz innych słów." },
  { icon: "source", title: "Wracaj do źródeł", text: "Każde podsumowanie AI prowadzi do materiału źródłowego." },
  { icon: "history", title: "Zachowaj ciągłość", text: "Wersje, opiekunowie i statusy ułatwiają pracę zespołu." },
];

const KB_ROWS: { icon: IconName; title: string; meta: string; badge: string }[] = [
  { icon: "copy", title: "Sąsiedzki krąg spotkań", meta: "Karta modelu • relacje", badge: "Do weryfikacji" },
  { icon: "file", title: "Pierwsze spotkanie z mieszkańcami", meta: "Scenariusz • współpraca", badge: "Szablon" },
  { icon: "flask", title: "Jak zaplanować lokalny pilotaż?", meta: "Poradnik • testowanie", badge: "Szablon" },
  { icon: "chart", title: "Arkusz obserwacji i wniosków", meta: "Narzędzie • ewaluacja", badge: "Szablon" },
];

const BOARD: { col: string; cards: { title: string; tag: string; who: "I" | "H" | "M" }[] }[] = [
  {
    col: "Do ustalenia",
    cards: [
      { title: "Wybrać dostępne miejsce spotkań", tag: "Przestrzeń", who: "I" },
      { title: "Zaprosić osoby z osiedla", tag: "Kontakt", who: "M" },
    ],
  },
  {
    col: "Rozwijamy",
    cards: [
      { title: "Ułożyć scenariusz pierwszego spotkania", tag: "Warsztat", who: "H" },
      { title: "Sprawdzić potrzeby uczestników", tag: "Rozmowy", who: "M" },
    ],
  },
  {
    col: "Plan pilotażu",
    cards: [
      { title: "Ustalić sposób zbierania informacji zwrotnej", tag: "Ewaluacja", who: "H" },
      { title: "Przygotować kartę wniosków do udostępnienia", tag: "Upowszechnianie", who: "I" },
    ],
  },
];
const WHO = { I: "Instytucja", H: "Hub", M: "Mieszkańcy" };

const TRUST: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "userCheck",
    title: "Człowiek ma ostatnie słowo",
    text: "Rekomendacje AI wymagają weryfikacji. Zespół Hubu sprawdza źródła, a decyzje o działaniu podejmuje wspólnie z uczestnikami.",
  },
  {
    icon: "shield",
    title: "Tylko potrzebne dane",
    text: "Dostęp według ról, oddzielenie danych kontaktowych i kontrola nad tym, co trafia do wspólnej przestrzeni. Zgłoszenie nie wymaga konta.",
  },
  {
    icon: "scan",
    title: "Wiesz, skąd bierze się sugestia",
    text: "Powody dopasowania, odnośniki do źródeł i oznaczenia wersji roboczych pomagają odróżnić podpowiedź od potwierdzonej wiedzy.",
  },
];

const FAQ = [
  {
    q: "Czy muszę mieć gotowy pomysł?",
    a: "Nie. Wystarczy opisać sytuację, która wymaga zmiany. Hub pomoże doprecyzować potrzebę, a Rozmach wskaże możliwe kierunki do wspólnego sprawdzenia.",
  },
  {
    q: "Kto może zgłosić potrzebę?",
    a: "Każdy: mieszkańcy, organizacje pozarządowe, samorządy, instytucje i osoby, które chcą pomóc. Nie trzeba zakładać konta – po zgłoszeniu dostajesz kod, którym sprawdzisz odpowiedź zespołu Hubu.",
  },
  {
    q: "Czy AI samo wybiera rozwiązanie?",
    a: "Nie. AI podpowiada innowacje z Biblioteki ROPS i pokazuje, dlaczego je poleca. Gdy AI jest niedostępne, działa zwykła wyszukiwarka. O tym, co rozwijać, decydują ludzie – zespół Hubu razem z uczestnikami.",
  },
  {
    q: "Co dzieje się z danymi mojego zgłoszenia?",
    a: "Opis potrzeby trafia do zespołu Hubu i do statystyk trendów (bez danych osobowych). Do AI wysyłamy tylko treść opisu – nigdy kodów zgłoszeń ani danych kontaktowych. Dane wnioskodawcy z wniosku grantowego widzi wyłącznie administrator naboru.",
  },
  {
    q: "Jak rozwiązanie trafia do innych miejsc w regionie?",
    a: "Po teście powstaje karta wdrożenia i materiały. Sprawdzone innowacje trafiają do Biblioteki Innowacji Społecznych ROPS, a moduł Middleman pomaga instytucjom zamienić je w stałą usługę.",
  },
];

const fmtDate = (d: string) => new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "long" });
const kicker = "text-[0.8rem] font-bold uppercase tracking-wide text-brand-900";
const big = "font-display leading-[1.02] text-brand-900";
const pill = "inline-flex rounded-full border border-line bg-white px-3 py-1 text-[0.8rem] font-semibold text-brand-900";

export default async function Home() {
  const repo = getRepo();
  const [innovations, nabory] = await Promise.all([repo.listInnovations(), repo.listNabory()]);
  const open = nabory.filter((n) => n.open);

  return (
    <>
      {/* HERO */}
      <section aria-labelledby="h-hero" className="full-bleed bg-brand-50">
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-20 text-center sm:pt-24">
          <p className="inline-flex rounded-full bg-accent px-3 py-1 text-[0.8rem] font-semibold text-white">Lokalna potrzeba. Wielki Rozmach.</p>
          <h1 id="h-hero" className="mt-7 text-brand-900">
            <span className="block text-[1.5rem] font-bold leading-tight sm:text-[2.3rem]">Masz pomysł, jak ułatwić komuś życie w Małopolsce?</span>
            <span className="mt-1 block font-display text-[3.1rem] leading-[1.05] sm:text-[5.6rem]">Zróbmy to z rozmachem.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg text-muted sm:text-xl">
            Zauważyłeś problem w swojej okolicy? Wrzucasz go, a Rozmach szuka pomysłów z Hubu. Pokazuje, dlaczego je poleca i co warto sprawdzić. Zespół Hubu
            pomoże z prototypem i finansowaniem.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="#zglos" className="inline-flex items-center gap-3 rounded-full bg-brand-900 px-6 py-4 font-semibold text-white no-underline hover:bg-brand-700">
              Zgłoś problem lub potrzebę <Icon name="external" className="h-4 w-4" />
            </Link>
            <Link href="/zasobnik" className="inline-flex items-center gap-3 rounded-full border border-line bg-white px-6 py-4 font-semibold text-brand-900 no-underline hover:border-brand-900">
              Zobacz, co już wspólnie naprawiamy <Icon name="external" className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-8 text-muted">Dla mieszkańców, organizacji pozarządowych, samorządów i chętnych do pomocy.</p>
        </div>
      </section>

      {/* ZDJĘCIA */}
      <section aria-label="Ludzie, którzy zmieniają swoją okolicę" className="relative pb-16 pt-10 sm:pb-24">
        <div className="flex items-start justify-center gap-3 sm:gap-5">
          {PHOTOS.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={p.src} src={p.src} alt="" className={`aspect-[4/5] w-[31%] rounded-3xl object-cover shadow-lg md:w-[18.5%] ${p.cls}`} />
          ))}
        </div>
        <p className="relative z-20 mx-auto mt-10 w-max max-w-full rounded-full bg-accent px-6 py-3 text-center font-display text-[1.1rem] text-white shadow-lg sm:absolute sm:bottom-10 sm:left-1/2 sm:mt-0 sm:max-w-[90%] sm:-translate-x-1/2 sm:text-[1.5rem]">
          Razem łączymy potrzeby, wiedzę i ludzi.
        </p>
      </section>

      {/* AKTUALNOŚCI – otwarte nabory pojawiają się automatycznie */}
      {open.length > 0 && (
        <section aria-labelledby="h-aktualnosci" className="mb-20 rounded-3xl border border-brand-100 px-6 py-5">
          <h2 id="h-aktualnosci" className={kicker}>
            Aktualności · trwające nabory
          </h2>
          <ul className="mt-3 space-y-2">
            {open.map((n) => (
              <li key={n.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="rounded-full bg-accent px-2.5 py-0.5 text-[0.75rem] font-semibold text-white">Trwa nabór</span>
                <Link href={`/kreator/wniosek?nabor=${n.id}`} className="font-semibold text-brand-900 underline-offset-2 hover:underline">
                  {n.title}
                </Link>
                <span className="text-sm text-muted">do {fmtDate(n.deadline)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* JAK DZIAŁA ROZMACH */}
      <section id="jak-dziala" aria-labelledby="h-jak" className="full-bleed scroll-mt-4 bg-brand-50">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <div>
              <p className={kicker}>Jak działa Rozmach</p>
              <h2 id="h-jak" className="mt-4 text-brand-900">
                <span className="block text-[1.7rem] font-semibold leading-tight sm:text-[2.3rem]">Od wkurzenia na rzeczywistość</span>
                <span className="block text-[2rem] font-bold leading-tight sm:text-[2.9rem]">do działającego projektu</span>
              </h2>
            </div>
            <p className="text-lg text-muted">Wspólna przestrzeń dla zgłoszenia, inspiracji, współpracy i testów. Razem łączymy potrzeby, wiedzę i ludzi z całego regionu.</p>
          </div>
          <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-7">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span aria-hidden className="grid h-12 w-12 place-items-center rounded-full bg-accent text-sm font-semibold text-white">
                  0{i + 1}
                </span>
                <div className="mt-5 border-t border-[#b9c4d8] pt-6">
                  <h3 className="text-[1.3rem] font-semibold leading-snug text-brand-900">
                    <span className="sr-only">Krok {i + 1}: </span>
                    {s.title}
                  </h3>
                  <p className="mt-3 text-[0.95rem] text-muted">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 01 ZGŁOŚ POTRZEBĘ */}
      <section id="zglos" aria-labelledby="h-zglos" className="grid scroll-mt-4 items-center gap-12 py-24 lg:grid-cols-2">
        <div>
          <p className={kicker}>01 / Zacznij od tego, co ważne</p>
          <h2 id="h-zglos" className={`${big} mt-5 text-[2.8rem] sm:text-[3.6rem]`}>
            Widzisz potrzebę?
            <br />
            Daj jej głos.
          </h2>
          <p className="mt-6 max-w-lg text-lg text-muted">
            Samotność seniorów. Bariery w dostępie do usług. Brak miejsca do spotkań. Twoja codzienna obserwacja może być początkiem wspólnej zmiany.
          </p>
          <ul className="mt-7 space-y-3 text-brand-900">
            {["Opisz sytuację własnymi słowami.", "Wskaż miejsce i osoby, których dotyczy.", "Hub pomoże doprecyzować kolejne kroki."].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <Icon name="check" className="h-5 w-5 shrink-0" /> {t}
              </li>
            ))}
          </ul>
          <Link href="/kreator" className="mt-9 inline-flex items-center gap-3 rounded-full bg-accent px-6 py-4 font-display text-[1.1rem] text-white no-underline hover:bg-[#b8174a]">
            Masz już pomysł? Wypełnij fiszkę <Icon name="external" className="h-4 w-4" />
          </Link>
        </div>
        <div className="-mx-2 rounded-[2rem] bg-brand-50 p-3 sm:mx-0 sm:p-7">
          <p className={pill}>Działa naprawdę • bez zakładania konta</p>
          <div className="mt-5">
            <NeedForm />
          </div>
        </div>
      </section>

      {/* 02 AI POMAGA SZUKAĆ */}
      <section aria-labelledby="h-ai" className="grid items-center gap-12 pb-24 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <div className="order-2 rounded-[2rem] bg-brand-100 p-6 sm:p-8 lg:order-1">
          <div className="flex items-center justify-between">
            <p className={pill}>Przykład interfejsu • wyniki AI</p>
            <Icon name="sparkle" className="h-6 w-6 text-brand-900" />
          </div>
          <p className="mt-5 text-sm uppercase tracking-wide text-muted">Szukamy dla potrzeby</p>
          <p className="mt-1 text-[1.6rem] font-semibold leading-tight text-brand-900">Więcej spotkań dla osób starszych</p>
          <p className="mt-2 text-sm text-muted">2 przykładowe kierunki. To inspiracje, nie gotowa decyzja.</p>
          <ul className="mt-6 space-y-4">
            {AI_DEMO.map((r, i) => (
              <li key={r.title} className={`rounded-2xl bg-white p-5 ${i === 0 ? "border border-brand-900" : "border border-brand-100"}`}>
                <Link href={`/dopasuj?q=${encodeURIComponent("Więcej spotkań dla osób starszych")}`} className="flex items-start justify-between gap-3 no-underline">
                  <span className="text-[1.3rem] font-semibold text-brand-900">{r.title}</span>
                  <Icon name="external" className="mt-1.5 h-4 w-4 shrink-0 text-brand-900" />
                </Link>
                <p className="mt-3 flex gap-3 text-[0.95rem] text-ink">
                  <Icon name="sparkle" className="mt-0.5 h-4 w-4 shrink-0 text-brand-900" /> {r.why}
                </p>
                <p className="mt-3 text-sm text-muted">Do sprawdzenia: {r.check}</p>
                <p className="mt-2 text-xs text-muted">Źródło: przykładowa karta modelu • materiał demonstracyjny</p>
              </li>
            ))}
          </ul>
          <p className="mt-5 flex items-center gap-3 text-sm font-semibold text-brand-900">
            <Icon name="userCheck" className="h-5 w-5" /> Następny krok: weryfikacja przez zespół Hubu
          </p>
        </div>
        <div className="order-1 lg:order-2">
          <p className={kicker}>02 / AI pomaga szukać</p>
          <h2 id="h-ai" className={`${big} mt-5 text-[2.8rem] sm:text-[3.6rem]`}>
            Nie zaczynaj
            <br />
            od pustej kartki.
          </h2>
          <p className="mt-6 text-lg text-muted">
            Rozmach przeszukuje wiedzę Hubu – w tym {innovations.length} innowacji z Biblioteki ROPS – i kojarzy potrzeby z opisanymi rozwiązaniami. Pokazuje nie
            tylko propozycję, ale też powód dopasowania, źródło i to, co trzeba sprawdzić.
          </p>
          <div className="mt-8 border-t border-brand-100 pt-8">
            <h3 className="text-[1.3rem] font-semibold text-brand-900">AI podpowiada. Człowiek decyduje.</h3>
            <p className="mt-2 text-muted">Zespół Hubu ocenia wiarygodność źródeł i lokalny kontekst. Mieszkańcy współdecydują, który kierunek warto rozwijać.</p>
            <Link href="/dopasuj" className="mt-6 inline-flex items-center gap-3 rounded-full border border-line px-6 py-3.5 font-semibold text-brand-900 no-underline hover:border-brand-900">
              Poznaj rozwiązania <Icon name="external" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* DLA KOGO */}
      <section aria-labelledby="h-dla-kogo" className="full-bleed on-dark bg-brand-900 text-white">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <p className="text-[0.8rem] font-bold uppercase tracking-wide text-slate-300">Dla kogo tu jest miejsce?</p>
          <h2 id="h-dla-kogo" className="mt-4 font-display text-[2.6rem] leading-[1.08] !text-white sm:text-[3.4rem]">
            Nie musisz być fundacją,
            <br />
            aby coś zmienić.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-300">Każdy może przyczynić się do lokalnej zmiany. Pokaż nam, co w Twojej okolicy nie gra, i razem znajdziemy kolejny krok.</p>
          <Link href="#zglos" className="mt-8 inline-flex items-center gap-3 rounded-full bg-accent px-6 py-4 font-display text-[1.1rem] text-white no-underline hover:bg-[#b8174a]">
            Wchodzę w to — zgłaszam sprawę <Icon name="external" className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* INSPIRACJE */}
      <section aria-labelledby="h-inspiracje" className="py-24">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <p className={kicker}>Inspiracje do lokalnej zmiany</p>
            <h2 id="h-inspiracje" className={`${big} mt-5 text-[2.8rem] sm:text-[3.6rem]`}>
              Dobre pomysły
              <br />
              warto podawać dalej.
            </h2>
          </div>
          <p className="text-muted">Poznaj przykładowe kierunki działania. W docelowej bazie Hubu każdy model będzie uzupełniony o źródła, warunki wdrożenia i wnioski z testów.</p>
        </div>
        <Inspirations libraryCount={innovations.length} />
      </section>

      {/* DLA ZESPOŁU HUBU */}
      <section aria-labelledby="h-hub" className="full-bleed bg-brand-50">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-24 sm:px-8 lg:grid-cols-[1fr_1.25fr] lg:gap-16">
          <div>
            <p className={kicker}>Dla zespołu Hubu</p>
            <h2 id="h-hub" className={`${big} mt-5 text-[2.8rem] sm:text-[3.6rem]`}>
              Wiedza, która nie ginie w folderach.
            </h2>
            <p className="mt-6 text-lg text-muted">Zgłoszenia, modele, materiały i wnioski z pilotaży w jednym miejscu. Rozmach pomaga je porządkować, wyszukiwać i ponownie wykorzystywać.</p>
            <ul className="mt-8 space-y-5">
              {HUB_FEATURES.map((f) => (
                <li key={f.title} className="flex gap-4">
                  <Icon name={f.icon} className="mt-0.5 h-6 w-6 shrink-0 text-brand-900" />
                  <span>
                    <span className="block text-[1.15rem] font-semibold text-brand-900">{f.title}</span>
                    <span className="text-muted">{f.text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link href="/admin" className="mt-8 inline-flex items-center gap-3 rounded-full bg-brand-900 px-6 py-3.5 font-semibold text-white no-underline hover:bg-brand-700">
              Panel zespołu Hubu <Icon name="external" className="h-4 w-4" />
            </Link>
          </div>
          <div>
            <p className={pill}>Przykład interfejsu • materiały demonstracyjne</p>
            <div className="mt-4 overflow-hidden rounded-3xl bg-white shadow-[0_24px_60px_-30px_rgba(19,33,79,0.45)]">
              <div className="flex items-center justify-between bg-brand-900 px-6 py-4 text-white">
                <p className="flex items-center gap-3 text-lg font-semibold">
                  <Icon name="sparkle" className="h-5 w-5 text-[#ff7aa0]" /> ROZMACH / Baza wiedzy
                </p>
                <p className="hidden text-sm text-slate-300 sm:block">Widok zespołu Hubu</p>
              </div>
              <div className="p-6">
                <p className="flex items-center gap-3 rounded-lg border border-line px-4 py-3 text-ink">
                  <Icon name="search" className="h-5 w-5 text-brand-900" /> Jak wspierać relacje sąsiedzkie?
                </p>
                <p className="mt-5 flex flex-wrap gap-2 text-sm font-semibold">
                  <span className="rounded-full bg-accent px-3 py-1 text-white">Wszystkie materiały</span>
                  <span className="rounded-full border border-line px-3 py-1 text-brand-900">Modele</span>
                  <span className="rounded-full border border-line px-3 py-1 text-brand-900">Pilotaże</span>
                </p>
                <ul className="mt-4 divide-y divide-brand-100">
                  {KB_ROWS.map((r) => (
                    <li key={r.title} className="flex items-center gap-4 py-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-900">
                        <Icon name={r.icon} className="h-5 w-5" />
                      </span>
                      <span className="flex-1">
                        <span className="block font-semibold text-brand-900">{r.title}</span>
                        <span className="text-sm text-muted">{r.meta}</span>
                      </span>
                      <span className="rounded-full border border-line px-3 py-1 text-sm font-semibold text-brand-900">{r.badge}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 rounded-2xl bg-brand-50 p-5">
                  <p className="flex items-center gap-2 font-semibold text-brand-900">
                    <Icon name="sparkle" className="h-5 w-5" /> Podsumowanie AI • wersja robocza
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    W tym przykładzie wspólnym punktem modeli jest bliskość miejsca spotkań. Sprawdź dostępność przestrzeni i udział lokalnego opiekuna.
                  </p>
                  <Link href="/zasobnik#materialy" className="mt-3 inline-block text-sm font-semibold text-brand-900 hover:underline">
                    Zobacz materiały źródłowe →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 03–04 ROZWIJAJ, TESTUJ, DZIEL SIĘ */}
      <section aria-labelledby="h-rozwijaj" className="py-24">
        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-end">
          <div>
            <p className={kicker}>03–04 / Rozwijaj, testuj, dziel się</p>
            <h2 id="h-rozwijaj" className={`${big} mt-5 text-[2.6rem] sm:text-[3.4rem]`}>
              Od wspólnego pomysłu
              <br />
              do lokalnego działania.
            </h2>
          </div>
          <p className="text-lg text-muted">Jedno miejsce na rozmowy, zadania i ustalenia. Każdy wie, co wnosi i jaki jest kolejny krok.</p>
        </div>
        <div className="mt-12 grid gap-8 lg:grid-cols-[1.8fr_1fr]">
          <div className="rounded-[2rem] bg-brand-50 p-6 sm:p-7">
            <p className={pill}>Przykład interfejsu • fikcyjny projekt</p>
            <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[1.6rem] font-semibold text-brand-900">Sąsiedzki krąg spotkań</p>
                <p className="text-muted">Mieszkańcy + zespół Hubu + instytucja</p>
              </div>
              <span className="rounded-full bg-accent px-3 py-1 text-sm font-semibold text-white">Rozwijanie</span>
            </div>
            <p aria-hidden className="mt-5 flex gap-6 border-b border-[#b9c4d8] pb-3 text-[0.95rem] text-muted">
              <span className="font-semibold text-brand-900">Tablica zadań</span>
              <span>Rozmowy</span>
              <span>Pliki</span>
              <span className="hidden sm:inline">Plan pilotażu</span>
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {BOARD.map((c) => (
                <div key={c.col}>
                  <p className="mb-3 font-semibold text-brand-900">{c.col}</p>
                  <ul className="space-y-3">
                    {c.cards.map((t) => (
                      <li key={t.title} className="rounded-xl border border-brand-100 bg-white p-4">
                        <p className="font-medium text-brand-900">{t.title}</p>
                        <p className="mt-2 text-xs text-muted">{t.tag}</p>
                        <p className="mt-3 flex items-center gap-2 text-xs text-muted">
                          <span aria-hidden className="grid h-6 w-6 place-items-center rounded-full bg-brand-50 font-semibold text-brand-900">
                            {t.who}
                          </span>
                          {WHO[t.who]}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-6 flex items-center gap-3 text-sm text-muted">
              <Icon name="message" className="h-5 w-5 text-brand-900" /> Najpierw porozmawiajmy z mieszkańcami. Plan pilotażu uzgodnimy wspólnie.
            </p>
          </div>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/testujmy.jpg" alt="" loading="lazy" className="h-64 w-full rounded-3xl object-cover" />
            <h3 className="mt-7 text-[1.8rem] font-semibold leading-tight text-brand-900">
              Testujmy mało.
              <br />
              Uczmy się dużo.
            </h3>
            <p className="mt-4 text-muted">
              Przed startem ustalamy, co zmierzyć. W tym przykładzie: udział w spotkaniach, poczucie kontaktu i dostępność miejsca. To plan pomiaru, nie wyniki.
            </p>
            <div className="mt-6 flex gap-3 rounded-2xl bg-brand-100 p-5 text-brand-900">
              <Icon name="share" className="mt-0.5 h-5 w-5 shrink-0" />
              <p>
                Po ewaluacji: karta wdrożenia, materiały i wnioski dla kolejnych miejsc w regionie.{" "}
                <Link href="/tester" className="font-semibold underline-offset-2 hover:underline">
                  Zgłoś się do testów
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ZASADY AI */}
      <section id="zasady-ai" aria-labelledby="h-zasady" className="full-bleed scroll-mt-4 bg-brand-50">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-8">
          <p className={kicker}>Tak projektujemy Rozmach</p>
          <h2 id="h-zasady" className={`${big} mt-5 text-[2.4rem] sm:text-[3.3rem]`}>
            Wsparcie AI. Zaufanie między ludźmi.
          </h2>
          <ul className="mt-12 grid gap-10 md:grid-cols-3">
            {TRUST.map((t) => (
              <li key={t.title}>
                <span aria-hidden className="grid h-12 w-12 place-items-center rounded-full bg-accent text-white">
                  <Icon name={t.icon} className="h-6 w-6" />
                </span>
                <h3 className="mt-6 text-[1.4rem] font-semibold text-brand-900">{t.title}</h3>
                <p className="mt-3 text-muted">{t.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="h-faq" className="grid gap-12 py-24 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className={kicker}>Warto wiedzieć</p>
          <h2 id="h-faq" className={`${big} mt-5 text-[2.8rem] sm:text-[3.6rem]`}>
            Pierwszy krok?
            <br />
            Bez wielkich barier.
          </h2>
          <p className="mt-6 max-w-md text-lg text-muted">Kilka odpowiedzi, zanim opowiesz nam o swojej potrzebie.</p>
        </div>
        <div className="border-t border-[#b9c4d8]">
          {FAQ.map((f, i) => (
            <details key={f.q} open={i === 0} className="group border-b border-[#b9c4d8]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-6 text-[1.2rem] font-medium text-brand-900 [&::-webkit-details-marker]:hidden">
                {f.q}
                <Icon name="plus" className="h-5 w-5 shrink-0 group-open:hidden" />
                <Icon name="minus" className="hidden h-5 w-5 shrink-0 group-open:block" />
              </summary>
              <p className="-mt-2 pb-6 text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
