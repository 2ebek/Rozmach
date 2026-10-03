import { describe, expect, it } from "vitest";
import { DECLARATIONS_B, IwsForm, declarationsFor, DECLARATIONS_A, iwsQuestions, isValidNip, isValidRegon, spanMonths, sumCosts, type IwsFormT } from "./iws";
import { validIwsForm } from "./iws.fixture";

const firstError = (f: unknown) => {
  const r = IwsForm.safeParse(f);
  return r.success ? null : r.error.issues[0]?.message;
};

describe("formularz IWS 2.0", () => {
  it("NIP i REGON – sumy kontrolne", () => {
    expect(isValidNip("526-025-02-74")).toBe(true);
    expect(isValidNip("5260250275")).toBe(false);
    expect(isValidNip("123")).toBe(false);
    expect(isValidRegon("123456785")).toBe(true);
    expect(isValidRegon("123456786")).toBe(false);
    expect(isValidRegon("12345678512347")).toBe(true);
  });

  it("okres i koszty planu", () => {
    const f = validIwsForm();
    expect(spanMonths(f.plan.preparation)).toBe(3);
    expect(spanMonths([...f.plan.testPhase1, ...f.plan.testPhase2])).toBe(9);
    expect(spanMonths([{ action: "x", from: "2026-11", to: "2027-02", cost: 0 }])).toBe(4);
    expect(sumCosts([...f.plan.preparation, ...f.plan.testPhase1, ...f.plan.testPhase2])).toBe(8000.5);
  });

  it("przyjmuje poprawny formularz osoby fizycznej", () => {
    expect(firstError(validIwsForm())).toBeNull();
  });

  it("odrzuca przekroczone okresy, kwotę różną od sumy i odwrócone terminy", () => {
    const f = validIwsForm();
    f.plan.preparation[0]!.from = "2026-12";
    expect(firstError(f)).toMatch(/przygotowawczy nie może przekroczyć 3/);

    const g = validIwsForm();
    g.plan.testPhase2[0]!.to = "2028-01";
    expect(firstError(g)).toMatch(/testowania nie może przekroczyć 9/);

    const h = validIwsForm();
    h.grantAmount = 9000;
    expect(firstError(h)).toMatch(/musi być równa sumie kosztów/);

    const i = validIwsForm();
    i.plan.testPhase1[0] = { action: "Wstecz", from: "2027-08", to: "2027-04", cost: 5000.5 };
    expect(firstError(i)).toMatch(/kończy się przed rozpoczęciem/);
  });

  it("wymaga wszystkich oświadczeń właściwych dla wnioskodawcy i RODO", () => {
    const f = validIwsForm();
    f.declarations[3] = false;
    expect(firstError(f)).toMatch(/wszystkie oświadczenia/);
    expect(firstError({ ...validIwsForm(), rodoAccepted: false })).toMatch(/RODO/);

    // podmiot składa oświadczenia B – lista A ma inną długość
    const p: IwsFormT = {
      ...validIwsForm(),
      applicant: {
        kind: "podmiot",
        podmiot: {
          name: "Fundacja Przykładowa",
          krs: "",
          regon: "123456785",
          nip: "5260250274",
          address: "ul. Przykładowa 10",
          postalCode: "30-002",
          city: "Kraków",
          phone: "+48 12 000 00 00",
          email: "biuro@example.org",
          representative: { role: "Prezes", name: "Jan Przykładowy", phone: "+48 500 000 001", email: "p@example.org" },
          contact: { role: "Koordynatorka", name: "Ewa Testowa", phone: "+48 500 000 002", email: "k@example.org" },
        },
      },
    };
    expect(firstError(p)).toMatch(/wszystkie oświadczenia/);
    expect(firstError({ ...p, declarations: DECLARATIONS_B.map(() => true) })).toBeNull();
    expect(declarationsFor("grupa")).toBe(DECLARATIONS_A);
  });

  it("waliduje dane wnioskodawcy (NIP podmiotu, liczba partnerów grupy)", () => {
    const f = validIwsForm();
    expect(firstError({ ...f, applicant: { kind: "osoba", osoba: { ...(f.applicant as { osoba: object }).osoba, postalCode: "30001" } } })).toMatch(/00-000/);
    const grupa = { kind: "grupa", grupa: { partners: [{ kind: "osoba", name: "A B", details: "adres, tel." }], contact: { name: "A B", phone: "500000000", email: "a@example.org" } } };
    expect(firstError({ ...f, applicant: grupa })).toMatch(/co najmniej 2/);
  });

  it("pytania naboru odpowiadają punktom formularza i mapują się na fiszkę", () => {
    const q = iwsQuestions();
    expect(q.map((x) => x.id)).toEqual(["tytul", "opis", "innowacyjnosc", "diagnoza", "odbiorcy", "zmiana", "wizja", "zespol"]);
    expect(q.find((x) => x.id === "diagnoza")?.prefillFrom).toBe("problem");
    expect(q.find((x) => x.id === "zespol")?.prefillFrom).toBeUndefined();
  });
});
