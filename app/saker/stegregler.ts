import type { KontrollsakSteg } from "~/saker/types.backend";

export type StegbaserteSaksregler = {
  erAktiv: boolean;
  kanUtføreUtredningsarbeid: boolean;
  kanLasteOppFiler: boolean;
  kanRedigereDokumenter: boolean;
  kanLeggeTilHistorikk: boolean;
  kanEndreDeltTilgang: boolean;
  kanFristilleAnsvarlig: boolean;
  kanEndreEnhetForUfordeltSak: boolean;
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
    // Ufordelte saker kan bare flyttes til annen enhet i disse stegene.
    kanEndreEnhetForUfordeltSak: erOpprettetEllerStrafferettslig,
  };
}
