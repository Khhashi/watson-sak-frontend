import { hentFilerForSak } from "~/testing/mock-store/filer.server";
import { hentJournalposterForSak } from "~/testing/mock-store/journalposter.server";
import type { MockState } from "~/testing/mock-store/session.server";
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

const typekoder: Record<string, string> = { INNGAAENDE: "I", UTGAAENDE: "U", NOTAT: "N" };

/**
 * Journalposter for saken i mock-sesjonen: de som er arkivert fra saken, pluss
 * eksempelpostene. Dokumentene til en arkivert journalpost er filene som ble
 * arkivert på den. Nyeste først, som i SAF.
 */
export function hentMockArkivJournalposter(state: MockState, sakId: string): ArkivJournalpost[] {
  const filer = hentFilerForSak(state, sakId);
  const arkiverte = hentJournalposterForSak(state, sakId).map(
    (journalpost): ArkivJournalpost => ({
      journalpostId: journalpost.journalpostId,
      datoOpprettet: journalpost.opprettet,
      journalposttype: typekoder[journalpost.journalposttype] ?? journalpost.journalposttype,
      journalstatus: "JOURNALFOERT",
      tittel: journalpost.tittel,
      tema: "KTR",
      temanavn: "Kontroll",
      avsenderMottaker: null,
      dokumenter: filer
        .filter((fil) => fil.arkivertJournalpostId === journalpost.journalpostId)
        .map((fil) => ({ dokumentInfoId: fil.id, tittel: fil.filnavn })),
    }),
  );
  return [...arkiverte, ...mockJournalposter].sort((a, b) =>
    b.datoOpprettet.localeCompare(a.datoOpprettet),
  );
}
