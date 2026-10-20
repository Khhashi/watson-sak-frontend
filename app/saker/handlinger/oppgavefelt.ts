import { z } from "zod";

/** Feltene i `OppgaveSkjema`. Gjelderverdi er påkrevd, men sendes ikke til backend ennå. */
export const oppgavefeltSkjema = z.object({
  oppgavetype: z.string({ error: "Velg oppgavetype" }).min(1, "Velg oppgavetype"),
  prioritet: z.string({ error: "Velg prioritet" }).min(1, "Velg prioritet"),
  frist: z.string({ error: "Velg frist" }).min(1, "Velg frist"),
  behandlendeEnhet: z.string({ error: "Velg behandlende enhet" }).min(1, "Velg behandlende enhet"),
  gjelderverdi: z.string({ error: "Velg gjelderverdi" }).min(1, "Velg gjelderverdi"),
  beskrivelse: z.string({ error: "Skriv en beskrivelse" }).trim().min(1, "Skriv en beskrivelse"),
});
