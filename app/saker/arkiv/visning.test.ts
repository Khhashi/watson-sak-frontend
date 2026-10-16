import { describe, expect, it } from "vitest";
import {
  beskrivJournalposttype,
  formaterAvsenderMottaker,
  formaterJournalpostdato,
  formaterJournalstatus,
  formaterTema,
} from "./visning";

describe("formaterJournalpostdato", () => {
  it("formaterer ISO-dato uten tidssone som dd.mm.åååå", () => {
    expect(formaterJournalpostdato("2026-10-12T23:59:00")).toBe("12.10.2026");
  });

  it("returnerer ukjent format uendret", () => {
    expect(formaterJournalpostdato("ukjent")).toBe("ukjent");
  });
});

describe("beskrivJournalposttype", () => {
  it("beskriver kjente koder", () => {
    expect(beskrivJournalposttype("I")).toBe("Inngående");
    expect(beskrivJournalposttype("U")).toBe("Utgående");
    expect(beskrivJournalposttype("N")).toBe("Notat");
  });

  it("returnerer ukjente koder uendret og null for manglende kode", () => {
    expect(beskrivJournalposttype("X")).toBe("X");
    expect(beskrivJournalposttype(null)).toBeNull();
  });
});

describe("formaterJournalstatus", () => {
  it("oversetter kjente statuser", () => {
    expect(formaterJournalstatus("JOURNALFOERT")).toBe("Journalført");
    expect(formaterJournalstatus("EKSPEDERT")).toBe("Ekspedert");
  });

  it("viser ukjente statuser som rå kode", () => {
    expect(formaterJournalstatus("NY_STATUS")).toBe("NY_STATUS");
    expect(formaterJournalstatus(null)).toBe("");
  });
});

describe("formaterTema", () => {
  it("bruker temanavn og faller tilbake til temakode", () => {
    expect(formaterTema({ tema: "KTR", temanavn: "Kontroll" })).toBe("Kontroll");
    expect(formaterTema({ tema: "KTR", temanavn: null })).toBe("KTR");
    expect(formaterTema({ tema: null, temanavn: null })).toBe("");
  });
});

describe("formaterAvsenderMottaker", () => {
  it("viser navn eller tom tekst", () => {
    expect(
      formaterAvsenderMottaker({
        avsenderMottaker: { id: null, type: null, navn: "Arbeidsgiveren", erLikBruker: false },
      }),
    ).toBe("Arbeidsgiveren");
    expect(formaterAvsenderMottaker({ avsenderMottaker: null })).toBe("");
  });
});
