import { z } from "zod";
import type { IdeaPrefillField, NaborQuestion } from "./types";

/**
 * Formularz aplikacyjny ROPS – nabór pomysłów na innowacje społeczne w projekcie
 * „Inkubator Włączenia Społecznego 2.0” (FERS 2021–2027, Działanie 5.1), Załącznik nr 3 do Ogłoszenia.
 * Ten moduł opisuje formularz (pytania, oświadczenia, klauzule) i jego walidację – wspólny dla UI i API.
 */

export type ApplicantKind = "osoba" | "podmiot" | "grupa";

export const APPLICANT_KIND_LABEL: Record<ApplicantKind, string> = {
  osoba: "Osoba fizyczna",
  podmiot: "Podmiot (organizacja, firma, instytucja)",
  grupa: "Grupa nieformalna",
};

/** Pytania merytoryczne formularza (pkt 1, 3–8, 11) – z podpowiedziami jak w oryginale. */
export const IWS_SECTIONS = [
  { id: "tytul", no: "1", label: "Tytuł innowacji", hint: "Zastanów się nad tytułem, by był on krótki i kojarzący się z przedmiotem innowacji.", max: 150, long: false },
  {
    id: "opis",
    no: "3",
    label: "Opis innowacji",
    hint: "Na czym polega innowacja? Jaki jest jej charakter np. produkt, aplikacja, model pracy, rozwiązanie technologiczne? Jak można krótko ją określić, opisać? Jak rozwiązanie realizuje cel projektu: wsparcie procesu włączenia społecznego/przeciwdziałanie wykluczeniu społecznemu? Jak rozwiązanie wpisuje się w ideę deinstytucjonalizacji?",
    max: 4000,
    long: true,
  },
  {
    id: "innowacyjnosc",
    no: "4",
    label: "Innowacyjność rozwiązania",
    hint: "Pomóż nam lepiej zrozumieć wyjątkowość pomysłu. Czy podobne rozwiązania są stosowane w Polsce albo na świecie? W jaki sposób proponowany projekt wnosi nową wartość w rozwiązanie zdefiniowanego problemu? Czym projekt wyróżnia się na tle innych, realizowanych w tym zakresie?",
    max: 4000,
    long: true,
  },
  {
    id: "diagnoza",
    no: "5",
    label: "Diagnoza problemu, na który odpowiada Twoja innowacja",
    hint: "Na jaki problem odpowiada innowacja – wskaż dane statystyczne obrazujące skalę problemu? Jakie są podstawy tej diagnozy np. raporty, badania? Czy problem, który zamierzasz rozwiązać, jest zgodny z tematem wskazanym w Mapie Wyzwań Społecznych – jeśli tak, to jakim?",
    max: 4000,
    long: true,
  },
  {
    id: "odbiorcy",
    no: "6",
    label: "Opis odbiorców innowacji",
    hint: "Do kogo jest skierowana Twoja innowacja? Co tę grupę wyróżnia? Jakie ma potrzeby? Z jakiego powodu są to osoby wykluczone lub zagrożone wykluczeniem?",
    max: 3000,
    long: true,
  },
  {
    id: "zmiana",
    no: "7",
    label: "Zmiana, jaką wprowadza innowacja",
    hint: "Jak proponowane rozwiązanie wpłynie na opisany wyżej problem? Co zmieni w życiu grupy odbiorców? Jak wpłynie na włączenie społeczne adresatów? Dzięki czemu zapobiegnie procesowi wykluczenia społecznego?",
    max: 3000,
    long: true,
  },
  {
    id: "wizja",
    no: "8",
    label: "Wizja przyszłości innowacji",
    hint: "Czy innowacja ma potencjał do bycia zastosowaną w przyszłości na dużą skalę, dla szerokiej grupy odbiorców? Czy wypracowane rozwiązanie może zostać rozszerzone na inne grupy docelowe, być stosowane w innym kontekście lub miejscu? W jaki sposób? Opisz łatwość stosowania i wdrażalność rozwiązania.",
    max: 3000,
    long: true,
  },
  {
    id: "zespol",
    no: "11",
    label: "Zespół projektowy i jego doświadczenie",
    hint: "Kto będzie odpowiedzialny za realizację zadań w projekcie? Jakie doświadczenie w pracy z odbiorcami innowacji, planowaniu i wdrażaniu innowacji społecznych mają te osoby, instytucje, organizacje?",
    max: 3000,
    long: true,
  },
] as const;

export type IwsSectionId = (typeof IWS_SECTIONS)[number]["id"];

/** Które pole fiszki pomysłu wypełnia dany punkt formularza (pkt 11 „Zespół” fiszka celowo pomija – to dane o ludziach). */
export const SECTION_PREFILL: Partial<Record<IwsSectionId, IdeaPrefillField>> = {
  tytul: "title",
  opis: "essence",
  innowacyjnosc: "innovativeness",
  diagnoza: "problem",
  odbiorcy: "audience",
  zmiana: "change",
  wizja: "vision",
};

/** Pytania naboru IWS w formacie generycznym – panel admina wyświetla i dodaje treść wniosku tak jak w innych naborach. */
export const iwsQuestions = (): NaborQuestion[] =>
  IWS_SECTIONS.map((s) => ({ id: s.id, label: `${s.no}. ${s.label}`, hint: s.hint, maxLength: s.max, prefillFrom: SECTION_PREFILL[s.id] }));

/** Limity okresów z formularza (pkt 9). */
export const PREP_MAX_MONTHS = 3;
export const TEST_MAX_MONTHS = 9;

const PROJECT = "„Inkubator Włączenia Społecznego 2.0” realizowanym przez Województwo Małopolskie – Regionalny Ośrodek Polityki Społecznej w Krakowie oraz Krakowskie Centrum Innowacyjnych Technologii INNOAGH sp. z o.o. w ramach Programu Operacyjnego Fundusze Europejskie dla Rozwoju Społecznego 2021–2027 współfinansowanego ze środków Europejskiego Funduszu Społecznego +";
const NO_DUPLICATE =
  "składana innowacja społeczna nie powiela standardowych form wsparcia, innowacji już wdrożonych lub inkubowanych na terenie Polski, w tym działań zrealizowanych w Programie Operacyjnym Kapitał Ludzki, Programie Operacyjnym Wiedza Edukacja Rozwój na lata 2014–2020, w szczególności w Działaniu 4.1: Innowacje Społeczne oraz w Regionalnych Programach Operacyjnych oraz przedsięwzięć zaplanowanych lub realizowanych w Programie Fundusze Europejskie dla Rozwoju Społecznego na lata 2021–2027 lub Regionalnych Programach Operacyjnych";
const EQUALITY =
  "deklaruję, że w realizacji przyszłych zadań w procesie realizacji innowacji będą stosowane zasady równościowe obowiązujące w ramach funduszy unijnych na lata 2021–2027, w tym zasady równości szans i niedyskryminacji, standardy dostępności dla osób z niepełnosprawnościami, zasady równości kobiet i mężczyzn, a także zasady polityki zrównoważonego rozwoju, w tym zasada DNSH poprzez zastosowanie rozwiązań proekologicznych";
const RODO_SELF =
  "potwierdzam wypełnienie wobec mnie obowiązku informacyjnego w zakresie przetwarzania przez Regionalny Ośrodek Polityki Społecznej w Krakowie (w tym w imieniu Instytucji Zarządzającej) moich danych osobowych niezbędnych do realizacji naboru w ramach Projektu";
const RODO_OTHERS =
  "wypełniłem/am obowiązki informacyjne przewidziane w art. 13 lub art. 14 RODO (w tym za Regionalny Ośrodek Polityki Społecznej w Krakowie oraz Instytucję Zarządzającą) wobec osób fizycznych, których dane osobowe bezpośrednio lub pośrednio pozyskałem w celu udziału w naborze i zobowiązuję się wypełnić je wobec osób fizycznych, których dane osobowe bezpośrednio lub pośrednio pozyskam w celu zawarcia i realizacji umowy o powierzenie grantu";

/** Pkt 12 A – oświadczenia dla osoby fizycznej (także członków grupy nieformalnej). */
export const DECLARATIONS_A: string[] = [
  "posiadam miejsce zamieszkania (w rozumieniu Kodeksu cywilnego) na terenie Polski",
  "posiadam pełną zdolność do czynności prawnych",
  "nie byłem/am skazany/a prawomocnym wyrokiem sądu za umyślne przestępstwo ścigane z oskarżenia publicznego lub umyślne przestępstwo skarbowe",
  "nie jestem wykluczony/a z możliwości otrzymania środków przeznaczonych na realizację programów finansowanych z udziałem środków europejskich na podstawie artykułu 207 ust. 4 ustawy o finansach publicznych",
  "nie podlegam wykluczeniu z otrzymania wsparcia wynikającego z nałożonych sankcji w związku z agresją Federacji Rosyjskiej na Ukrainę, tj. nie jestem osobą, względem której stosowane są środki sankcyjne, oraz nie jestem związany/a z osobami lub podmiotami, względem których stosowane są środki sankcyjne",
  "nie zalegam z uiszczaniem podatków, opłat lub składek na ubezpieczenia społeczne lub zdrowotne",
  `dobrowolnie deklaruję uczestnictwo w projekcie pn. ${PROJECT}`,
  "zapoznałem/am się z Procedurami realizacji projektu grantowego pn. „Inkubator Włączenia Społecznego 2.0” i akceptuję warunki w nich zawarte",
  "dane zawarte w niniejszym formularzu są zgodne z prawdą",
  "nie jestem zatrudniony/a w Regionalnym Ośrodku Polityki Społecznej w Krakowie (ROPS) ani w Krakowskim Centrum Innowacyjnych Technologii INNOAGH sp. z o.o. (INNOAGH) oraz nie łączy lub nie łączył mnie z pracownikiem ROPS lub INNOAGH związek małżeński, stosunek pokrewieństwa i powinowactwa (w linii prostej lub w linii bocznej do II stopnia), związek z tytułu przysposobienia, opieki lub kurateli",
  "nie aplikuję równolegle o wsparcie na ten sam pomysł (w tym samym temacie, tj. włączenie społeczne) w ramach innego projektu wdrażanego w V Osi Priorytetowej programu FERS 2021–2027 (Działanie 5.1: Innowacje społeczne) lub innego funduszu",
  NO_DUPLICATE,
  "nie będę pobierał/a wpłat i opłat od osób biorących udział w testowaniu innowacji",
  "w ramach naboru aplikacji w konkursie składam nie więcej niż 2 aplikacje",
  "innowacja przedstawiona w aplikacji nie ma charakteru wdrożeniowego",
  "jestem świadomy/a, że mój formularz aplikacyjny zostanie udostępniony członkom Komisji Oceny Innowacji i Rady Innowacji Społecznych dokonującym jego oceny i weryfikacji oraz innym inkubatorom innowacji społecznych w celu weryfikacji niepowtarzalności wnioskodawcy",
  EQUALITY,
  RODO_SELF,
  RODO_OTHERS,
];

/** Pkt 12 B – oświadczenia dla reprezentanta podmiotu. */
export const DECLARATIONS_B: string[] = [
  "podmiot, który reprezentuję, posiada siedzibę (lub oddział) na terenie Polski",
  "urzędujący członek organu zarządzającego lub nadzorczego podmiotu, który reprezentuję, wspólnik w spółce jawnej lub partnerskiej albo komplementariusz w spółce komandytowej lub komandytowo-akcyjnej nie został skazany prawomocnym wyrokiem sądu za umyślne przestępstwo ścigane z oskarżenia publicznego lub umyślne przestępstwo skarbowe",
  "podmiot, który reprezentuję, nie został wykluczony z możliwości otrzymania środków przeznaczonych na realizację programów finansowanych z udziałem środków europejskich na podstawie artykułu 207 ust. 4 ustawy o finansach publicznych",
  "podmiot, który reprezentuję, nie podlega wykluczeniu z otrzymania wsparcia wynikającego z nałożonych sankcji w związku z agresją Federacji Rosyjskiej na Ukrainę, tj. nie jest podmiotem, względem którego stosowane są środki sankcyjne, oraz nie jest związany z osobami lub podmiotami, względem których stosowane są środki sankcyjne",
  "podmiot, który reprezentuję, nie zalega z uiszczeniem podatków, opłat, składek na ubezpieczenia społeczne lub zdrowotne",
  "wspólnik lub urzędujący członkowie organu zarządzającego lub nadzorczego wnioskującego podmiotu nie są zatrudnieni/one w Regionalnym Ośrodku Polityki Społecznej w Krakowie (ROPS) ani w Krakowskim Centrum Innowacyjnych Technologii INNOAGH sp. z o.o. (INNOAGH)",
  "nie łączy lub nie łączył mnie z personelem projektu oraz władzami ROPS lub INNOAGH, Głównym Księgowym lub Radcą Prawnym ROPS lub INNOAGH związek małżeński, stosunek pokrewieństwa i powinowactwa (w linii prostej lub bocznej do II stopnia) i/lub związek z tytułu przysposobienia, opieki lub kurateli i/lub inny związek faktyczny, który może budzić uzasadnione wątpliwości co do zachowania zasady bezstronności",
  "podmiot, który reprezentuję, nie jest jednostką organizacyjną Województwa Małopolskiego lub osobą prawną Województwa Małopolskiego",
  "podmiot, który reprezentuję, nie jest powiązany kapitałowo z Akademią Górniczo-Hutniczą im. Stanisława Staszica w Krakowie",
  `w imieniu podmiotu, który reprezentuję, dobrowolnie deklaruję uczestnictwo w projekcie pn. ${PROJECT}`,
  "zapoznałem/am się z Procedurami realizacji projektu grantowego pn. „Inkubator Włączenia Społecznego 2.0” i akceptuję warunki w nich zawarte",
  "dane zawarte w niniejszym formularzu są zgodne z prawdą",
  "podmiot, który reprezentuję, nie aplikuje równolegle o wsparcie na ten sam pomysł (w tym samym temacie, tj. włączenie społeczne) w ramach innego projektu wdrażanego w V Osi Priorytetowej programu FERS 2021–2027 (Działanie 5.1: Innowacje społeczne) lub innego funduszu",
  NO_DUPLICATE,
  "podmiot, który reprezentuję, nie będzie pobierał wpłat i opłat od osób biorących udział w testowaniu innowacji",
  "w ramach naboru podmiot, który reprezentuję, składa nie więcej niż 2 aplikacje",
  "innowacja przedstawiona w aplikacji nie ma charakteru wdrożeniowego",
  "jestem świadomy/a, że niniejszy formularz aplikacyjny zostanie udostępniony członkom Komisji Oceny Innowacji i Rady Innowacji Społecznych dokonującym jego oceny i weryfikacji oraz innym inkubatorom innowacji społecznych w celu weryfikacji niepowtarzalności wnioskodawcy",
  EQUALITY,
  RODO_SELF,
  RODO_OTHERS,
];

/** Grupa nieformalna – partnerzy to osoby fizyczne, więc obowiązują oświadczenia A. */
export const declarationsFor = (kind: ApplicantKind) => (kind === "podmiot" ? DECLARATIONS_B : DECLARATIONS_A);

/** Klauzule informacyjne RODO z formularza (skrót wiernie oddający treść; pełny tekst w Załączniku nr 3). */
export const RODO_CLAUSES: { title: string; points: string[] }[] = [
  {
    title: "Klauzula informacyjna Regionalnego Ośrodka Polityki Społecznej w Krakowie",
    points: [
      "Administratorem danych osobowych jest Regionalny Ośrodek Polityki Społecznej w Krakowie, ul. Piastowska 32, 30-070 Kraków.",
      "Z Inspektorem Ochrony Danych można się skontaktować pod adresem iod@rops.krakow.pl.",
      "Dane są przetwarzane na podstawie art. 6 ust. 1 lit. c i art. 9 ust. 2 lit. g RODO w celu realizacji zadań finansowanych ze środków europejskich (m.in. udzielenia wsparcia, monitoringu, ewaluacji, kontroli, audytu, sprawozdawczości i archiwizacji) na podstawie rozporządzeń (UE) 2021/1060 i 2021/1057 oraz ustawy z 28 kwietnia 2022 r.",
      "Dane pozyskujemy od osób, których dotyczą, albo od instytucji i podmiotów zaangażowanych w realizację zadania, w szczególności od wnioskodawców i partnerów.",
      "Odbiorcami danych mogą być podmioty uprawnione na podstawie przepisów, organy nadzoru i kontroli oraz podmioty przetwarzające dane na polecenie Administratora.",
      "Dane są przetwarzane przez czas realizacji zadań, a następnie przechowywane zgodnie z przepisami archiwalnymi ROPS.",
      "Przysługuje Pani/Panu prawo dostępu do danych, ich sprostowania, ograniczenia przetwarzania, przenoszenia, sprzeciwu oraz usunięcia – w granicach przepisów, a także skargi do Prezesa Urzędu Ochrony Danych Osobowych.",
      "Podanie danych wymaganych przepisami lub umową jest obowiązkowe – bez nich nie jest możliwe zawarcie umowy lub udział w naborze.",
      "Dane nie będą przekazywane do państwa trzeciego ani organizacji międzynarodowej i nie będą poddawane zautomatyzowanemu podejmowaniu decyzji, w tym profilowaniu.",
    ],
  },
  {
    title: "Klauzula informacyjna ministra właściwego do spraw rozwoju regionalnego (Instytucja Zarządzająca)",
    points: [
      "Odrębnym administratorem danych jest minister właściwy do spraw rozwoju regionalnego, ul. Wspólna 2/4, 00-926 Warszawa.",
      "Dane są przetwarzane w związku z realizacją FERS – w celu monitorowania, sprawozdawczości, komunikacji, publikacji, ewaluacji, zarządzania finansowego, weryfikacji i audytów oraz określania kwalifikowalności uczestników.",
      "Podstawą jest obowiązek prawny (art. 6 ust. 1 lit. c, art. 9 ust. 2 lit. g RODO) wynikający m.in. z rozporządzeń (UE) 2021/1060 i 2021/1057, ustawy wdrożeniowej, Kodeksu postępowania administracyjnego i ustawy o finansach publicznych.",
      "Dane mogą być powierzane lub udostępniane podmiotom realizującym zadania w FERS, organom Komisji Europejskiej, ministrowi właściwemu ds. finansów publicznych, Prezesowi ZUS oraz dostawcom usług IT i łączności.",
      "Dane są przechowywane przez okres niezbędny do realizacji celów; przysługują prawa z art. 15–18, 20 i 77 RODO; dane nie są przekazywane do państwa trzeciego ani profilowane.",
      "Kontakt z Inspektorem Ochrony Danych: ul. Wspólna 2/4, 00-926 Warszawa lub IOD@mfipr.gov.pl.",
    ],
  },
];

// ---------------- walidacja ----------------

const req = (label: string, max = 200) => z.string().trim().min(1, `Uzupełnij pole: ${label}.`).max(max, `Pole „${label}” jest za długie.`);
const email = (label: string) => z.string().trim().email(`Podaj poprawny adres e-mail (${label}).`);
const phone = (label: string) => z.string().trim().regex(/^\+?[0-9 ()-]{9,20}$/, `Podaj poprawny numer telefonu (${label}).`);
const postal = z.string().trim().regex(/^\d{2}-\d{3}$/, "Kod pocztowy podaj w formacie 00-000.");
const digits = (s: string) => s.replace(/[\s-]/g, "");

/** NIP – 10 cyfr z sumą kontrolną. */
export function isValidNip(input: string): boolean {
  const d = digits(input);
  if (!/^\d{10}$/.test(d)) return false;
  const w = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const sum = w.reduce((s, x, i) => s + x * Number(d[i]), 0);
  return sum % 11 === Number(d[9]);
}

/** REGON – 9 lub 14 cyfr z sumą kontrolną. */
export function isValidRegon(input: string): boolean {
  const d = digits(input);
  const check = (n: string, w: number[]) => {
    const r = w.reduce((s, x, i) => s + x * Number(n[i]), 0) % 11;
    return (r === 10 ? 0 : r) === Number(n[w.length]);
  };
  if (/^\d{9}$/.test(d)) return check(d, [8, 9, 2, 3, 4, 5, 6, 7]);
  if (/^\d{14}$/.test(d)) return check(d.slice(0, 9), [8, 9, 2, 3, 4, 5, 6, 7]) && check(d, [2, 4, 8, 5, 0, 9, 7, 3, 6, 1, 2, 4, 8]);
  return false;
}

const Person = z.object({
  firstName: req("Imię", 80),
  lastName: req("Nazwisko", 80),
  address: req("Adres korespondencyjny"),
  postalCode: postal,
  city: req("Miejscowość", 80),
  phone: phone("osoba fizyczna"),
  email: email("osoba fizyczna"),
});

const ContactPerson = (who: string) =>
  z.object({
    role: req(`Funkcja (${who})`, 100),
    name: req(`Imię i nazwisko (${who})`, 120),
    phone: phone(who),
    email: email(who),
  });

const Entity = z.object({
  name: req("Nazwa podmiotu"),
  krs: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{10}$/.test(digits(v)), "KRS to 10 cyfr (zostaw puste, jeśli podmiot nie ma KRS)."),
  regon: z.string().trim().refine(isValidRegon, "Podaj poprawny numer REGON (9 lub 14 cyfr)."),
  nip: z.string().trim().refine(isValidNip, "Podaj poprawny numer NIP (10 cyfr)."),
  address: req("Adres siedziby"),
  postalCode: postal,
  city: req("Miejscowość", 80),
  phone: phone("podmiot"),
  email: email("podmiot"),
  representative: ContactPerson("osoba upoważniona do reprezentowania podmiotu"),
  contact: ContactPerson("osoba do kontaktów roboczych"),
});

const Partner = z.object({
  kind: z.enum(["osoba", "podmiot"]),
  /** Imię i nazwisko albo nazwa podmiotu. */
  name: req("Partner – imię i nazwisko lub nazwa", 200),
  /** Pozostałe dane jak w pkt I lub II formularza (adres, telefon, e-mail, a dla podmiotu KRS/REGON/NIP). */
  details: req("Partner – dane kontaktowe i identyfikacyjne", 1000),
});

const Group = z.object({
  partners: z.array(Partner).min(2, "Grupa nieformalna to co najmniej 2 partnerów.").max(5, "Formularz przewiduje najwyżej 5 partnerów."),
  contact: z.object({ name: req("Reprezentant grupy – imię i nazwisko", 120), phone: phone("reprezentant grupy"), email: email("reprezentant grupy") }),
});

const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Termin podaj jako miesiąc i rok.");
export const PlanRow = z.object({
  action: req("Działanie", 500),
  from: month,
  to: month,
  cost: z.number({ invalid_type_error: "Koszt musi być liczbą." }).min(0, "Koszt nie może być ujemny.").max(10_000_000),
});
export type PlanRowT = z.infer<typeof PlanRow>;

const toIndex = (m: string) => Number(m.slice(0, 4)) * 12 + Number(m.slice(5, 7)) - 1;

/** Długość okresu w miesiącach (od najwcześniejszego „od” do najpóźniejszego „do”, włącznie). */
export function spanMonths(rows: PlanRowT[]): number {
  if (rows.length === 0) return 0;
  const from = Math.min(...rows.map((r) => toIndex(r.from)));
  const to = Math.max(...rows.map((r) => toIndex(r.to)));
  return to - from + 1;
}

export const sumCosts = (rows: PlanRowT[]) => Math.round(rows.reduce((s, r) => s + r.cost, 0) * 100) / 100;

export const IwsForm = z
  .object({
    applicant: z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("osoba"), osoba: Person }),
      z.object({ kind: z.literal("podmiot"), podmiot: Entity }),
      z.object({ kind: z.literal("grupa"), grupa: Group }),
    ]),
    sections: z.object(
      Object.fromEntries(IWS_SECTIONS.map((s) => [s.id, z.string().trim().min(s.long ? 20 : 3, `Uzupełnij pkt ${s.no}: ${s.label} (min. ${s.long ? 20 : 3} znaków).`).max(s.max, `Pkt ${s.no} jest za długi (maks. ${s.max} znaków).`)])) as Record<
        IwsSectionId,
        z.ZodString
      >,
    ),
    plan: z.object({
      preparation: z.array(PlanRow).min(1, "Dodaj co najmniej jedno działanie w okresie przygotowawczym."),
      testPhase1: z.array(PlanRow).min(1, "Dodaj co najmniej jedno działanie w fazie I testu."),
      testPhase2: z.array(PlanRow),
    }),
    grantAmount: z.number({ invalid_type_error: "Podaj wnioskowaną kwotę grantu." }).positive("Wnioskowana kwota grantu musi być większa od zera."),
    declarations: z.array(z.boolean()),
    rodoAccepted: z.literal(true, { errorMap: () => ({ message: "Potwierdź zapoznanie się z klauzulami informacyjnymi RODO." }) }),
  })
  .superRefine((f, ctx) => {
    const all = [...f.plan.preparation, ...f.plan.testPhase1, ...f.plan.testPhase2];
    for (const r of all) {
      if (toIndex(r.to) < toIndex(r.from)) ctx.addIssue({ code: "custom", message: `Działanie „${r.action}” kończy się przed rozpoczęciem.` });
    }
    if (spanMonths(f.plan.preparation) > PREP_MAX_MONTHS) {
      ctx.addIssue({ code: "custom", message: `Okres przygotowawczy nie może przekroczyć ${PREP_MAX_MONTHS} miesięcy.` });
    }
    if (spanMonths([...f.plan.testPhase1, ...f.plan.testPhase2]) > TEST_MAX_MONTHS) {
      ctx.addIssue({ code: "custom", message: `Okres testowania nie może przekroczyć ${TEST_MAX_MONTHS} miesięcy.` });
    }
    const total = sumCosts(all);
    if (Math.abs(total - f.grantAmount) > 0.005) {
      ctx.addIssue({ code: "custom", message: `Wnioskowana kwota grantu (${formatPln(f.grantAmount)}) musi być równa sumie kosztów z planu działania (${formatPln(total)}).` });
    }
    const needed = declarationsFor(f.applicant.kind).length;
    if (f.declarations.length !== needed || f.declarations.some((d) => !d)) {
      ctx.addIssue({ code: "custom", message: "Zaznacz wszystkie oświadczenia z pkt 12 – są warunkiem udziału w naborze." });
    }
  });

export type IwsFormT = z.infer<typeof IwsForm>;

export const formatPln = (n: number) => new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(n);

/** Nazwa pomysłodawcy do list w panelu (bez danych kontaktowych). */
export function applicantName(a: IwsFormT["applicant"]): string {
  if (a.kind === "osoba") return `${a.osoba.firstName} ${a.osoba.lastName}`;
  if (a.kind === "podmiot") return a.podmiot.name;
  return `Grupa nieformalna (${a.grupa.partners.length} partnerów)`;
}
