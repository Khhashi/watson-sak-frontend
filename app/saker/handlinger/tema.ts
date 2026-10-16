import { z } from "zod";

/** Temaene Watson Sak kan arkivere journalposter og opprette oppgaver på. */
const TEMAER = ["KTR", "KTA"] as const;

export type Tema = (typeof TEMAER)[number];

export const STANDARD_TEMA: Tema = "KTR";

const temaEtiketter: Record<Tema, string> = {
  KTR: "Kontroll",
  KTA: "Kontroll anmeldelse",
};

export const temaValg = TEMAER.map((verdi) => ({ verdi, label: temaEtiketter[verdi] }));

export const temaSkjema = z.enum(TEMAER, { error: "Velg tema" });

export function erTema(verdi: unknown): verdi is Tema {
  return temaSkjema.safeParse(verdi).success;
}

/** Viser temanavn med kode, f.eks. «Kontroll (KTR)». */
export function formaterTemavalg(tema: string): string {
  return erTema(tema) ? `${temaEtiketter[tema]} (${tema})` : tema;
}
