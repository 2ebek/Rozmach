import type { Feedback, HubEvent, Message, NeedSubmission, PartnerOffer } from "../types";

/**
 * Fikcyjne dane startowe, żeby panel trendów, forum i powiadomienia nie były puste w demo.
 * Wspólne dla repozytorium w pamięci (lokalnie) i w bazie (pierwsze uruchomienie z pustą bazą).
 */
export function demoState() {
  const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();
  const needs: NeedSubmission[] = [
    { id: "n1", text: "Samotni seniorzy w gminie", area: "dla-seniorow", submitterRole: "jst", createdAt: daysAgo(9) },
    { id: "n2", text: "Starsi nie radzą sobie z e-urzędem", area: "dla-seniorow", submitterRole: "resident", createdAt: daysAgo(6) },
    { id: "n3", text: "Brak psychologa dla młodzieży w powiecie", area: "dla-dzieci-mlodziezy-i-rodziny", submitterRole: "ngo", createdAt: daysAgo(4) },
    { id: "n4", text: "Seniorzy bez kontaktu z rodziną", area: "dla-seniorow", submitterRole: "resident", createdAt: daysAgo(3) },
    { id: "n5", text: "Daleko do urzędu i poradni", area: "dla-osob-o-ograniczonej-mobilnosci", submitterRole: "resident", createdAt: daysAgo(1) },
  ];
  const feedback: Feedback[] = [
    { id: "f1", innovationId: "rops-senior-cuder", rating: 5, comment: "Gramy w świetlicy co tydzień, seniorzy bardzo się angażują. Polecam!", wantsToTest: false, createdAt: daysAgo(5) },
    { id: "f2", innovationId: "rops-merkury", rating: 4, comment: "Świetne do nauki obsługi biletomatu, ale potrzebny jest opiekun grupy.", wantsToTest: true, createdAt: daysAgo(2) },
  ];
  const messages: Message[] = [
    { id: "m1", author: "Zespół Hubu", role: "admin", text: "Dzień dobry! Tu możecie pytać o nabory, szukać partnerów i dzielić się doświadczeniami.", createdAt: daysAgo(3) },
    { id: "m2", author: "Gmina Przykładowa", role: "jst", text: "Szukamy organizacji, która pomogłaby nam uruchomić Kawiarenkę Seniora. Ktoś ma doświadczenie?", createdAt: daysAgo(2) },
    { id: "m3", author: "Mentorka ds. ekonomii społecznej", role: "expert", text: "Warto zacząć od rozmowy z autorami innowacji – w Bibliotece są opisane pierwsze kroki. Chętnie pomogę przygotować plan pilotażu.", createdAt: daysAgo(2) },
    { id: "m4", author: "Fundacja Sąsiedzi (przykład)", role: "ngo", text: "Prowadzimy podobne spotkania od roku, możemy się podzielić scenariuszami zajęć.", createdAt: daysAgo(1) },
  ];
  const partners: PartnerOffer[] = [
    { id: "p1", kind: "szukam", org: "Gmina Przykładowa", role: "jst", text: "Szukamy organizacji do prowadzenia Kawiarenki Seniora w 3 sołectwach.", area: "dla-seniorow", createdAt: daysAgo(4) },
    { id: "p2", kind: "oferuje", org: "Biblioteka Publiczna (przykład)", role: "ngo", text: "Udostępnimy salę i sprzęt na zajęcia cyfrowe dla seniorów, 2 popołudnia w tygodniu.", area: "dla-seniorow", createdAt: daysAgo(2) },
    { id: "p3", kind: "oferuje", org: "Ekspertka ds. ewaluacji", role: "expert", text: "Pomogę zaplanować badanie efektów pilotażu (ankiety, wskaźniki).", createdAt: daysAgo(1) },
  ];
  const events: HubEvent[] = [
    { id: "e2", kind: "reply", text: "Autor odpowiedział w wątku „Szkolne Kino Seniora”", href: "/admin?kolejka=zaakceptowany#kolejka", createdAt: daysAgo(3), read: false },
    { id: "e1", kind: "idea", text: "Nowa fiszka: „Wymiana usług sąsiedzkich”", href: "/admin#kolejka", createdAt: daysAgo(2), read: false },
  ];
  return { needs, feedback, messages, partners, events };
}
