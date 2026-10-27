import { describe, expect, it } from "vitest";
import type { KontrollsakSteg } from "~/saker/types.backend";
import { hentStegbaserteSaksregler } from "./stegregler";

describe("hentStegbaserteSaksregler", () => {
  it("begrenser Opprettet til klargjøring av saken", () => {
    expect(hentStegbaserteSaksregler("OPPRETTET")).toEqual({
      erAktiv: true,
      kanUtføreUtredningsarbeid: false,
      kanLasteOppFiler: true,
      kanRedigereDokumenter: false,
      kanLeggeTilHistorikk: false,
      kanEndreDeltTilgang: true,
      kanFristilleAnsvarlig: true,
      kanEndreEnhetForUfordeltSak: true,
    });
  });

  it("tillater utredningsarbeid for aktive steg etter Opprettet", () => {
    const aktiveSteg: KontrollsakSteg[] = ["UTREDES", "STRAFFERETTSLIG_VURDERING", "POLITI"];

    for (const steg of aktiveSteg) {
      expect(hentStegbaserteSaksregler(steg)).toMatchObject({
        erAktiv: true,
        kanUtføreUtredningsarbeid: true,
        kanLasteOppFiler: true,
        kanRedigereDokumenter: true,
        kanLeggeTilHistorikk: true,
        kanEndreDeltTilgang: true,
      });
    }
  });

  it.each<[KontrollsakSteg, boolean]>([
    ["OPPRETTET", true],
    ["UTREDNING", false],
    ["FORVALTNING", false],
    ["STRAFFERETTSLIG_VURDERING", true],
    ["POLITI", false],
    ["AVSLUTTET", false],
  ])("tillater fristilling i %s: %s", (steg, forventet) => {
    expect(hentStegbaserteSaksregler(steg).kanFristilleAnsvarlig).toBe(forventet);
  });

  it.each<[KontrollsakSteg, boolean]>([
    ["OPPRETTET", true],
    ["UTREDNING", false],
    ["FORVALTNING", false],
    ["STRAFFERETTSLIG_VURDERING", true],
    ["POLITI", false],
    ["AVSLUTTET", false],
  ])("tillater endring av enhet for ufordelt sak i %s: %s", (steg, forventet) => {
    expect(hentStegbaserteSaksregler(steg).kanEndreEnhetForUfordeltSak).toBe(forventet);
  });

  it("sperrer endringer for Avsluttet", () => {
    expect(hentStegbaserteSaksregler("AVSLUTTET")).toEqual({
      erAktiv: false,
      kanUtføreUtredningsarbeid: false,
      kanLasteOppFiler: false,
      kanRedigereDokumenter: false,
      kanLeggeTilHistorikk: false,
      kanEndreDeltTilgang: false,
      kanFristilleAnsvarlig: false,
      kanEndreEnhetForUfordeltSak: false,
    });
  });
});
