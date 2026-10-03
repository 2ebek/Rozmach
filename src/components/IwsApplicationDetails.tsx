import { APPLICANT_KIND_LABEL, PREP_MAX_MONTHS, TEST_MAX_MONTHS, declarationsFor, formatPln, spanMonths, sumCosts, type IwsFormT, type PlanRowT } from "@/lib/iws";

const fmtMonth = (m: string) => new Date(`${m}-01T00:00:00`).toLocaleDateString("pl-PL", { timeZone: "Europe/Warsaw", month: "long", year: "numeric" });

/** Część formularza IWS 2.0 z danymi wnioskodawcy, planem działania i oświadczeniami – tylko w panelu administratora. */
export function IwsApplicationDetails({ form }: { form: IwsFormT }) {
  const a = form.applicant;
  const rows: [string, string][] =
    a.kind === "osoba"
      ? [
          ["Imię i nazwisko", `${a.osoba.firstName} ${a.osoba.lastName}`],
          ["Adres", `${a.osoba.address}, ${a.osoba.postalCode} ${a.osoba.city}`],
          ["Kontakt", `${a.osoba.phone} · ${a.osoba.email}`],
        ]
      : a.kind === "podmiot"
        ? [
            ["Nazwa", a.podmiot.name],
            ["KRS / REGON / NIP", `${a.podmiot.krs || "–"} / ${a.podmiot.regon} / ${a.podmiot.nip}`],
            ["Siedziba", `${a.podmiot.address}, ${a.podmiot.postalCode} ${a.podmiot.city}`],
            ["Kontakt", `${a.podmiot.phone} · ${a.podmiot.email}`],
            ["Reprezentant", `${a.podmiot.representative.name} (${a.podmiot.representative.role}) · ${a.podmiot.representative.phone} · ${a.podmiot.representative.email}`],
            ["Kontakty robocze", `${a.podmiot.contact.name} (${a.podmiot.contact.role}) · ${a.podmiot.contact.phone} · ${a.podmiot.contact.email}`],
          ]
        : [
            ...a.grupa.partners.map((p, i): [string, string] => [`Partner ${i + 1} (${p.kind === "osoba" ? "osoba fizyczna" : "podmiot"})`, `${p.name} – ${p.details}`]),
            ["Reprezentant grupy", `${a.grupa.contact.name} · ${a.grupa.contact.phone} · ${a.grupa.contact.email}`],
          ];
  const all = [...form.plan.preparation, ...form.plan.testPhase1, ...form.plan.testPhase2];

  return (
    <div className="space-y-5">
      <p className="rounded-lg border-2 border-amber-300 bg-amber-50 px-3 py-2 text-sm text-slate-900">Dane osobowe – tylko do oceny formalnej. Nie kopiuj ich poza panel.</p>
      <div>
        <h4 className="font-black text-brand-900">Wnioskodawca: {APPLICANT_KIND_LABEL[a.kind]}</h4>
        <dl className="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[12rem_1fr]">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="font-bold text-slate-700">{k}</dt>
              <dd className="break-words text-slate-900">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div>
        <h4 className="font-black text-brand-900">Plan działania i budżet</h4>
        <p className="text-sm text-slate-700">
          Przygotowanie {spanMonths(form.plan.preparation)} / {PREP_MAX_MONTHS} mies. · testowanie {spanMonths([...form.plan.testPhase1, ...form.plan.testPhase2])} /{" "}
          {TEST_MAX_MONTHS} mies.
        </p>
        <PlanTable caption="Okres przygotowawczy" rows={form.plan.preparation} />
        <PlanTable caption="Faza I testu" rows={form.plan.testPhase1} />
        {form.plan.testPhase2.length > 0 && <PlanTable caption="Faza II testu" rows={form.plan.testPhase2} />}
        <p className="mt-3 font-black text-brand-900">
          Wnioskowana kwota grantu: {formatPln(form.grantAmount)} <span className="font-normal text-slate-700">(suma kosztów {formatPln(sumCosts(all))})</span>
        </p>
      </div>
      <p className="text-sm text-emerald-900">
        ✓ Złożono {form.declarations.length} z {declarationsFor(a.kind).length} oświadczeń z pkt 12 {a.kind === "podmiot" ? "B" : "A"} i potwierdzono klauzule RODO.
      </p>
    </div>
  );
}

function PlanTable({ caption, rows }: { caption: string; rows: PlanRowT[] }) {
  return (
    <div className="mt-3 overflow-x-auto" tabIndex={0} role="region" aria-label="Plan działania (tabela przewijana w poziomie)">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <caption className="mb-1 text-left font-bold text-slate-800">{caption}</caption>
        <thead>
          <tr className="border-b border-slate-300">
            <th scope="col" className="py-1 pr-3">Działanie</th>
            <th scope="col" className="py-1 pr-3">Termin</th>
            <th scope="col" className="py-1 text-right">Koszt</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-200">
              <td className="py-1 pr-3">{r.action}</td>
              <td className="py-1 pr-3">
                {fmtMonth(r.from)} – {fmtMonth(r.to)}
              </td>
              <td className="py-1 text-right">{formatPln(r.cost)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan={2} className="py-1 pr-3 text-right">
              Razem
            </th>
            <td className="py-1 text-right font-bold">{formatPln(sumCosts(rows))}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
