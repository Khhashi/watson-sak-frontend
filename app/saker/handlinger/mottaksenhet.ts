import type { KontrollsakSaksbehandler } from "~/saker/types.backend";

/** Speiler backend-regelen: ny ansvarlig må tilhøre mottaksenheten, med unntak av ekstra saksbehandlere. */
export function kanMottaSakFraEnhet(saksbehandler: KontrollsakSaksbehandler, enhet: string) {
  return saksbehandler.erEkstraSaksbehandler === true || saksbehandler.kontrollEnhetId === enhet;
}
