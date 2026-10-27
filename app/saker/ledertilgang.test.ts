import { describe, expect, it } from "vitest";
import type { KontrollsakResponse, KontrollsakSaksbehandler } from "~/saker/types.backend";
import { kanFordeleSak, kanOverføreTil, kanTildeleTil } from "./ledertilgang";

function lagSak(
  enhet: string | null,
  tilgang?: { erLederForSakensEnhet: boolean; ledetEnheter: string[] },
): KontrollsakResponse {
  return {
    enhet,
    tilgang: tilgang && {
      harTilgangTilKontrollobjekt: true,
      kanSeHistorikk: true,
      kanSeRelaterteSaker: true,
      kanTildeleSak: true,
      kanSeArkiv: false,
      kanSeFiler: false,
      ...tilgang,
    },
  } as KontrollsakResponse;
}

function lagMottaker(kontrollEnhetId: string | null): KontrollsakSaksbehandler {
  return { navIdent: "Z100001", navn: "Mottaker", enhet: null, kontrollEnhetId };
}

describe("kanFordeleSak", () => {
  it("lar eier fordele uansett ledertilgang", () => {
    expect(kanFordeleSak(lagSak("ost"), true)).toBe(true);
  });

  it("lar leder for sakens enhet fordele", () => {
    expect(
      kanFordeleSak(lagSak("ost", { erLederForSakensEnhet: true, ledetEnheter: ["ost"] }), false),
    ).toBe(true);
  });

  it("avviser leder for en annen enhet", () => {
    expect(
      kanFordeleSak(lagSak("nord", { erLederForSakensEnhet: false, ledetEnheter: ["ost"] }), false),
    ).toBe(false);
  });

  it("avviser når backend ikke har sendt tilgang", () => {
    expect(kanFordeleSak(lagSak("ost"), false)).toBe(false);
  });
});

describe("kanOverføreTil", () => {
  const sak = lagSak("ost", { erLederForSakensEnhet: true, ledetEnheter: ["ost", "vest"] });

  it("tillater mottaker i sakens enhet", () => {
    expect(kanOverføreTil(sak, lagMottaker("ost"))).toBe(true);
  });

  it("tillater mottaker i en enhet innlogget leder", () => {
    expect(kanOverføreTil(sak, lagMottaker("vest"))).toBe(true);
  });

  it("avviser mottaker i en enhet innlogget ikke leder", () => {
    expect(kanOverføreTil(sak, lagMottaker("nord"))).toBe(false);
  });

  it("tillater mottaker uten konfigurert enhet, som backend", () => {
    expect(kanOverføreTil(sak, lagMottaker(null))).toBe(true);
  });
});

describe("kanTildeleTil", () => {
  const sak = lagSak("ost", { erLederForSakensEnhet: false, ledetEnheter: ["vest"] });

  it("tillater mottaker i en enhet innlogget leder", () => {
    expect(kanTildeleTil(sak, lagMottaker("vest"))).toBe(true);
  });

  it("avviser mottaker i en annen enhet, også sakens egen", () => {
    expect(kanTildeleTil(sak, lagMottaker("ost"))).toBe(false);
  });

  it("avviser mottaker uten konfigurert enhet", () => {
    expect(kanTildeleTil(sak, lagMottaker(null))).toBe(false);
  });
});
