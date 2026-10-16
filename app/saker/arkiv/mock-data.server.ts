import type { ArkivJournalpost } from "./typer";

/** Syntetiske journalposter for lokal utvikling. Inneholder ingen ekte personopplysninger. */
const mockJournalposter: ArkivJournalpost[] = [
  {
    journalpostId: "mock-jp-1",
    datoOpprettet: "2026-03-12T09:15:00",
    journalposttype: "I",
    journalstatus: "JOURNALFOERT",
    tittel: "Svarbrev om kontoopplysninger",
    tema: "KTR",
    temanavn: "Kontroll",
    avsenderMottaker: {
      id: null,
      type: "ORGNR",
      navn: "Sparebank 1 Østlandet",
      erLikBruker: false,
    },
    dokumenter: [
      { dokumentInfoId: "mock-dok-1", tittel: "Svarbrev om kontoopplysninger" },
      { dokumentInfoId: "mock-dok-2", tittel: "Kontoutskrift januar" },
    ],
  },
  {
    journalpostId: "mock-jp-2",
    datoOpprettet: "2026-03-10T14:02:00",
    journalposttype: "U",
    journalstatus: "EKSPEDERT",
    tittel: "Brev - innhenting av kontoopplysninger",
    tema: "KTR",
    temanavn: "Kontroll",
    avsenderMottaker: { id: null, type: "ORGNR", navn: "Arbeidsgiveren AS", erLikBruker: false },
    dokumenter: [
      { dokumentInfoId: "mock-dok-3", tittel: "Brev - innhenting av kontoopplysninger" },
    ],
  },
  {
    journalpostId: "mock-jp-3",
    datoOpprettet: "2026-03-05T08:00:00",
    journalposttype: "N",
    journalstatus: "FERDIGSTILT",
    tittel: "Kontrollnotat",
    tema: "KTA",
    temanavn: null,
    avsenderMottaker: null,
    dokumenter: [
      { dokumentInfoId: "mock-dok-4", tittel: "Kontrollnotat" },
      { dokumentInfoId: "mock-dok-5", tittel: null },
    ],
  },
];

export function hentMockArkivJournalposter(): ArkivJournalpost[] {
  return mockJournalposter;
}
