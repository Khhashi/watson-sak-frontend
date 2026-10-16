import type { ArkivJournalpost } from "./typer";

const journalposttyper: Record<string, string> = {
  I: "Inngående",
  U: "Utgående",
  N: "Notat",
};

const journalstatuser: Record<string, string> = {
  MOTTATT: "Mottatt",
  JOURNALFOERT: "Journalført",
  FERDIGSTILT: "Ferdigstilt",
  EKSPEDERT: "Ekspedert",
  UNDER_ARBEID: "Under arbeid",
  FEILREGISTRERT: "Feilregistrert",
  UTGAAR: "Utgår",
  AVBRUTT: "Avbrutt",
  UKJENT_BRUKER: "Ukjent bruker",
  RESERVERT: "Reservert",
  OPPLASTING_DOKUMENT: "Opplasting dokument",
  UKJENT: "Ukjent",
};

/**
 * Formaterer `datoOpprettet` (ISO uten tidssone, f.eks. `2026-10-12T09:30:00`) som `12.10.2026`.
 * Vi leser datodelen direkte, så nettleserens tidssone ikke kan flytte datoen.
 */
export function formaterJournalpostdato(iso: string): string {
  const treff = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!treff) return iso;
  const [, år, måned, dag] = treff;
  return `${dag}.${måned}.${år}`;
}

const typekoderFraWatson: Record<string, string> = {
  INNGAAENDE: "I",
  UTGAAENDE: "U",
  NOTAT: "N",
};

/** Gjør journalposttypen fra Watson (`INNGAAENDE` osv.) om til typekoden i SAF (I/U/N). */
export function tilJournalposttypekode(type: string): string {
  return typekoderFraWatson[type] ?? type;
}

/** Full beskrivelse av typekoden (I/U/N). Ukjente koder returneres uendret. */
export function beskrivJournalposttype(kode: string | null): string | null {
  if (!kode) return null;
  return journalposttyper[kode] ?? kode;
}

/** Norsk visningstekst for journalstatus. Ukjente koder returneres uendret. */
export function formaterJournalstatus(kode: string | null): string {
  if (!kode) return "";
  return journalstatuser[kode] ?? kode;
}

export function formaterTema(journalpost: Pick<ArkivJournalpost, "tema" | "temanavn">): string {
  return journalpost.temanavn ?? journalpost.tema ?? "";
}

export function formaterAvsenderMottaker(
  journalpost: Pick<ArkivJournalpost, "avsenderMottaker">,
): string {
  return journalpost.avsenderMottaker?.navn ?? "";
}
