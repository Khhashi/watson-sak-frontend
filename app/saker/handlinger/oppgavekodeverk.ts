import { z } from "zod";

/** Gjelderverdier og oppgavetyper for ett tema, slik backend henter dem fra Oppgave API. */
export const oppgavekodeverkSchema = z.object({
  gjelderverdier: z.array(
    z.object({
      behandlingstema: z.string(),
      behandlingstemaTerm: z.string(),
    }),
  ),
  oppgavetyper: z.array(
    z.object({
      oppgavetype: z.string(),
      term: z.string(),
    }),
  ),
});

export type Oppgavekodeverk = z.infer<typeof oppgavekodeverkSchema>;

export const oppgavekodeverkResultatSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("ok"), kodeverk: oppgavekodeverkSchema }),
  z.object({ status: z.literal("feil") }),
]);

export type OppgavekodeverkResultat = z.infer<typeof oppgavekodeverkResultatSchema>;
