import { z } from "zod";

/**
 * Journalposter fra Gosys/SAF, slik `GET /api/v1/kontrollsaker/{sakId}/arkiv/journalposter`
 * returnerer dem. Kodeverdiene (type, status, tema) holdes åpne som tekst, slik at
 * nye koder fra SAF ikke får hele listen til å feile.
 */
const arkivJournalpostSchema = z.object({
  journalpostId: z.string(),
  datoOpprettet: z.string(),
  journalposttype: z.string().nullish().default(null),
  journalstatus: z.string().nullish().default(null),
  tittel: z.string().nullish().default(null),
  tema: z.string().nullish().default(null),
  temanavn: z.string().nullish().default(null),
  avsenderMottaker: z
    .object({
      id: z.string().nullish().default(null),
      type: z.string().nullish().default(null),
      navn: z.string().nullish().default(null),
      erLikBruker: z.boolean().default(false),
    })
    .nullish()
    .default(null),
  dokumenter: z
    .array(
      z.object({
        dokumentInfoId: z.string(),
        tittel: z.string().nullish().default(null),
      }),
    )
    .default([]),
});

export const arkivJournalposterSchema = z.array(arkivJournalpostSchema);

export type ArkivJournalpost = z.infer<typeof arkivJournalpostSchema>;

/** Det vi vet om en journalpost rett etter at den er opprettet fra Watson Sak. */
export type OpprettetJournalpost = {
  journalpostId: string | null;
  /** Typen slik Watson sender den: `INNGAAENDE`, `UTGAAENDE` eller `NOTAT`. */
  journalposttype: string;
  tittel: string;
  dokumenttitler: string[];
};

/** Svaret fra BFF-ruta til klienten. */
export type ArkivJournalposterResultat =
  | { status: "ok"; journalposter: ArkivJournalpost[] }
  | { status: "feil"; årsak: "for-mange-forespørsler" | "utilgjengelig" };
