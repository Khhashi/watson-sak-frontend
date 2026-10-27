import type { KontrollsakSteg } from "~/saker/types.backend";

export type StegbaserteSaksregler = {
  erAktiv: boolean;
  kanUtføreUtredningsarbeid: boolean;
  kanLasteOppFiler: boolean;
  kanRedigereDokumenter: boolean;
  kanLeggeTilHistorikk: boolean;
  kanEndreDeltTilgang: boolean;
  kanFristilleAnsvarlig: boolean;
};

export function hentStegbaserteSaksregler(steg: KontrollsakSteg): StegbaserteSaksregler {
  const erAktiv = steg !== "AVSLUTTET";
  const kanUtføreUtredningsarbeid = erAktiv && steg !== "OPPRETTET";

  return {
    erAktiv,
    kanUtføreUtredningsarbeid,
    kanLasteOppFiler: erAktiv,
    kanRedigereDokumenter: kanUtføreUtredningsarbeid,
    kanLeggeTilHistorikk: kanUtføreUtredningsarbeid,
    // Deling krever en eier, som sjekkes der deling vises og i backend.
    kanEndreDeltTilgang: erAktiv,
    // Fristilling fjerner bare ansvarlig. Steg, status og deling beholdes.
    kanFristilleAnsvarlig: steg === "OPPRETTET" || steg === "STRAFFERETTSLIG_VURDERING",
  };
}
