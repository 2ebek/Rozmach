import { DECLARATIONS_A, IWS_SECTIONS, type IwsFormT } from "./iws";

const text = (n = 30) => "Opis innowacji społecznej ".repeat(3).slice(0, n);

/** Poprawny formularz IWS 2.0 osoby fizycznej z danymi FIKCYJNYMI (testy). */
export function validIwsForm(): IwsFormT {
  return {
    applicant: {
      kind: "osoba",
      osoba: { firstName: "Anna", lastName: "Przykładowa", address: "ul. Testowa 1", postalCode: "30-001", city: "Kraków", phone: "+48 500 000 000", email: "anna@example.org" },
    },
    sections: Object.fromEntries(IWS_SECTIONS.map((s) => [s.id, s.long ? text() : "Sąsiedzka spiżarnia"])) as IwsFormT["sections"],
    plan: {
      preparation: [{ action: "Rekrutacja", from: "2027-01", to: "2027-03", cost: 1000 }],
      testPhase1: [{ action: "Test I", from: "2027-04", to: "2027-08", cost: 5000.5 }],
      testPhase2: [{ action: "Test II", from: "2027-09", to: "2027-12", cost: 2000 }],
    },
    grantAmount: 8000.5,
    declarations: DECLARATIONS_A.map(() => true),
    rodoAccepted: true,
  };
}
