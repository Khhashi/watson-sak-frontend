import { describe, expect, it } from "vitest";
import { matcherAldersvarsel, parseAlderOgAnsvarlig } from "./aldersfilter";

const åpen = (opprettet: string) => ({ opprettet, steg: "UTREDNING" as const });

describe("matcherAldersvarsel", () => {
  const nå = new Date("2026-10-02T10:00:00Z");

  it("fra 30 dager: dag 30 er med, dag 29 er ikke", () => {
    expect(matcherAldersvarsel(åpen("2026-09-02T21:59:59Z"), "FRA_30_DAGER", nå)).toBe(true);
    expect(matcherAldersvarsel(åpen("2026-09-02T22:00:00Z"), "FRA_30_DAGER", nå)).toBe(false);
  });

  it("regner dagens dato i Oslo, ikke UTC", () => {
    const etterOsloMidnatt = new Date("2026-10-01T22:30:00Z"); // 2. okt. 00:30 i Oslo
    expect(
      matcherAldersvarsel(åpen("2026-09-02T12:00:00Z"), "FRA_30_DAGER", etterOsloMidnatt),
    ).toBe(true);
    const førOsloMidnatt = new Date("2026-10-01T21:59:00Z");
    expect(matcherAldersvarsel(åpen("2026-09-02T12:00:00Z"), "FRA_30_DAGER", førOsloMidnatt)).toBe(
      false,
    );
  });

  it("nærmer seg 12 måneder: 11 hele måneder er med, 10 og 12 er ikke", () => {
    expect(matcherAldersvarsel(åpen("2025-10-02T21:59:59Z"), "NAERMER_SEG_12_MAANEDER", nå)).toBe(
      false,
    );
    expect(matcherAldersvarsel(åpen("2025-10-02T22:00:00Z"), "NAERMER_SEG_12_MAANEDER", nå)).toBe(
      true,
    );
    expect(matcherAldersvarsel(åpen("2025-11-02T22:59:59Z"), "NAERMER_SEG_12_MAANEDER", nå)).toBe(
      true,
    );
    expect(matcherAldersvarsel(åpen("2025-11-02T23:00:00Z"), "NAERMER_SEG_12_MAANEDER", nå)).toBe(
      false,
    );
  });

  it("nærmer seg 12 måneder ved månedsslutt følger hele kalendermåneder", () => {
    const sisteFebruar = new Date("2026-02-28T12:00:00Z");
    // 28. mars 2025 = 11 mnd, 29.–31. mars 2025 = 10 mnd, 28. feb. 2025 = 12 mnd
    expect(
      matcherAldersvarsel(åpen("2025-03-28T10:00:00Z"), "NAERMER_SEG_12_MAANEDER", sisteFebruar),
    ).toBe(true);
    expect(
      matcherAldersvarsel(åpen("2025-03-31T10:00:00Z"), "NAERMER_SEG_12_MAANEDER", sisteFebruar),
    ).toBe(false);
    expect(
      matcherAldersvarsel(åpen("2025-03-01T10:00:00Z"), "NAERMER_SEG_12_MAANEDER", sisteFebruar),
    ).toBe(true);
    expect(
      matcherAldersvarsel(åpen("2025-02-28T10:00:00Z"), "NAERMER_SEG_12_MAANEDER", sisteFebruar),
    ).toBe(false);
  });

  it("utelater alltid avsluttede saker", () => {
    expect(
      matcherAldersvarsel(
        { opprettet: "2026-01-01T10:00:00Z", steg: "AVSLUTTET" },
        "FRA_30_DAGER",
        nå,
      ),
    ).toBe(false);
  });
});

describe("parseAlderOgAnsvarlig", () => {
  it("godtar gyldige verdier", () => {
    expect(
      parseAlderOgAnsvarlig(new URLSearchParams("aldersvarsel=FRA_30_DAGER&ansvarlig=MEG")),
    ).toEqual({ aldersvarsel: "FRA_30_DAGER", ansvarligMeg: true });
    expect(parseAlderOgAnsvarlig(new URLSearchParams())).toEqual({
      aldersvarsel: undefined,
      ansvarligMeg: false,
    });
  });

  it.each([
    "aldersvarsel=ukjent",
    "aldersvarsel=FRA_30_DAGER&aldersvarsel=NAERMER_SEG_12_MAANEDER",
    "ansvarlig=meg",
    "ansvarlig=Z123456",
    "ansvarlig=MEG&saksbehandler=Z123456",
    "ansvarlig=MEG&saksbehandler=&saksbehandler=Z123456",
  ])("avviser %s med 400 uten å gjenta verdien", (søk) => {
    try {
      parseAlderOgAnsvarlig(new URLSearchParams(søk));
      expect.unreachable();
    } catch (feil) {
      expect(feil).toMatchObject({ init: { status: 400 } });
      expect(JSON.stringify(feil)).not.toContain("Z123456");
    }
  });
});
