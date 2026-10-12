import { describe, expect, it } from "vitest";
import { mockKodeverk } from "~/testing/mock-store/kodeverk.server";
import { lagTilfeldigSak, skalViseTilfeldigSak } from "./tilfeldig-sak";

describe("skalViseTilfeldigSak", () => {
  it.each(["local-backend", "local-dev", "local-mock"])(
    "viser alltid tilfeldig sak lokalt i %s",
    (miljø) => {
      expect(skalViseTilfeldigSak(miljø, false, false)).toBe(true);
      expect(skalViseTilfeldigSak(miljø, true, true)).toBe(true);
    },
  );

  it("styrer tilfeldig sak i dev bare med dev-flagget", () => {
    expect(skalViseTilfeldigSak("dev", true, false)).toBe(true);
    expect(skalViseTilfeldigSak("dev", true, true)).toBe(true);
    expect(skalViseTilfeldigSak("dev", false, true)).toBe(false);
    expect(skalViseTilfeldigSak("dev", false, false)).toBe(false);
  });

  it("styrer tilfeldig sak i demo bare med demo-flagget", () => {
    expect(skalViseTilfeldigSak("demo", false, true)).toBe(true);
    expect(skalViseTilfeldigSak("demo", true, true)).toBe(true);
    expect(skalViseTilfeldigSak("demo", true, false)).toBe(false);
    expect(skalViseTilfeldigSak("demo", false, false)).toBe(false);
  });

  it("viser aldri tilfeldig sak i prod", () => {
    expect(skalViseTilfeldigSak("prod", true, true)).toBe(false);
    expect(skalViseTilfeldigSak("prod", false, false)).toBe(false);
  });
});

describe("lagTilfeldigSak", () => {
  it("lager en gyldig sammensatt sak fra kodeverket", () => {
    const sak = lagTilfeldigSak(mockKodeverk, () => 0);

    expect(sak).toEqual({
      kategori: "BEHANDLER",
      misbruktyper: ["BEHANDLER_25_7"],
      merkinger: ["LIME"],
      kilde: "PUBLIKUM",
      enhet: "ky153k",
      ytelser: [
        {
          type: "DAGPENGER",
          fraDato: "2025-01-01",
          tilDato: "2025-12-31",
          beløp: "20000",
        },
      ],
    });
  });

  it("returnerer null når kodeverket ikke kan fylle de påkrevde feltene", () => {
    expect(
      lagTilfeldigSak({
        ...mockKodeverk,
        kategorier: [],
      }),
    ).toBeNull();
  });
});
