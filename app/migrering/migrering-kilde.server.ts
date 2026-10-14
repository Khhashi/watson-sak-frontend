import { skalBrukeMockdata } from "~/config/env.server";
import type { hentInnloggetBruker } from "~/auth/innlogget-bruker.server";
import { httpMigreringKilde } from "./migrering-kilde-http.server";
import { mockMigreringKilde } from "./migrering-kilde-mock.server";
import type { MigreringFilter, MigreringLister } from "./types";

export type MigreringBruker = Awaited<ReturnType<typeof hentInnloggetBruker>>;

export type TildelingsSvar = { ok: true } | { ok: false; feil: string };

/**
 * Seam mellom migreringssiden og der kandidatene kommer fra. Loader og action kjenner bare dette interfacet.
 * Reglene (hvem som ser hva, bare «Ikke startet» kan tildeles på nytt) hører hjemme bak seamen:
 * i backend for HTTP-adapteret, og gjenskapt i mock-adapteret for `local-mock` og `demo`.
 * Adapterne kaster `Response` ved avvist handling, slik loader og action gjør.
 */
export interface MigreringKilde {
  hentLister(args: { side: number; filter: MigreringFilter }): Promise<MigreringLister>;
  tildel(args: {
    bruker: MigreringBruker;
    kandidatId: string;
    navIdent: string;
  }): Promise<TildelingsSvar>;
}

/** Velges per forespørsel, siden mock-modus og miljø kan styres per kjøring (og i tester). */
export function velgMigreringKilde(request: Request): MigreringKilde {
  return skalBrukeMockdata ? mockMigreringKilde(request) : httpMigreringKilde(request);
}
