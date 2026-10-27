import type { KontrollsakSteg } from "~/saker/types.backend";

export type StegbaserteSaksregler = {
  erAktiv: boolean;
  kanUtføreUtredningsarbeid: boolean;
  kanLasteOppFiler: boolean;
  kanRedigereDokumenter: boolean;
  kanLeggeTilHistorikk: boolean;
  kanEndreDeltTilgang: boolean;
  kanFristilleAnsvarlig: boolean;
  kanEndreEnhetUansettStatus: boolean;
};

export function hentStegbaserteSaksregler(steg: KontrollsakSteg): StegbaserteSaksregler {
  const erAktiv = steg !== "AVSLUTTET";
  const kanUtføreUtredningsarbeid = erAktiv && steg !== "OPPRETTET";
  const erOpprettetEllerStrafferettslig =
    steg === "OPPRETTET" || steg === "STRAFFERETTSLIG_VURDERING";

  return {
    erAktiv,
    kanUtføreUtredningsarbeid,
    kanLasteOppFiler: erAktiv,
    kanRedigereDokumenter: kanUtføreUtredningsarbeid,
    kanLeggeTilHistorikk: kanUtføreUtredningsarbeid,
    // Deling krever en eier, som sjekkes der deling vises og i backend.
    kanEndreDeltTilgang: erAktiv,
    // Fristilling fjerner bare ansvarlig. Steg, status og deling beholdes.
    kanFristilleAnsvarlig: erOpprettetEllerStrafferettslig,
    // Enhet kan endres i disse stegene selv om saken venter eller er i bero.
    kanEndreEnhetUansettStatus: erOpprettetEllerStrafferettslig,
  };
}
