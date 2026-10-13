import { data } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loader } from "./loader.server";

const miljøMock = vi.hoisted(() => ({ ENVIRONMENT: "prod" }));
vi.mock("~/config/env.server", () => ({ skalBrukeMockdata: false, env: miljøMock }));
const hentMigreringslisteMock = vi.hoisted(() => vi.fn());
vi.mock("~/migrering/api.server", () => ({ hentMigreringsliste: hentMigreringslisteMock }));
vi.mock("~/auth/access-token", () => ({ getBackendOboToken: vi.fn().mockResolvedValue("token") }));
vi.mock("~/auth/innlogget-bruker.server", () => ({
  hentInnloggetBruker: vi.fn().mockResolvedValue({
    name: "Saks Behandlersen",
    navIdent: "Z999999",
    erLeder: false,
  }),
}));
vi.mock("~/logging/logging", () => ({ logger: { warn: vi.fn(), error: vi.fn() } }));
vi.mock("~/fordeling/api.server", () => ({
  hentKontrollsaker: vi.fn().mockResolvedValue({ items: [] }),
}));

const hentOppsummeringMock = vi.hoisted(() => vi.fn());
vi.mock("./api.server", () => ({ hentMineSakerOppsummering: hentOppsummeringMock }));

const args = {
  request: new Request("http://localhost/"),
  params: {},
  context: {},
} as Parameters<typeof loader>[0];

describe("landingsside-loader mot backend", () => {
  afterEach(() => {
    hentOppsummeringMock.mockReset();
    hentMigreringslisteMock.mockReset();
    miljøMock.ENVIRONMENT = "prod";
  });

  it("bruker oppsummeringen fra backend i velkomstteksten", async () => {
    hentOppsummeringMock.mockResolvedValue({ nye: 0, aktive: 2, venter: 0, iBero: 0 });

    const resultat = await loader(args);
    if (resultat.type !== "saksbehandler") throw new Error("Forventet saksbehandler");

    expect(resultat.velkomstOppsummering).toBe("Akkurat nå har du 2 aktive saker.");
  });

  it("laster siden uten oppsummering når oppsummeringen feiler", async () => {
    hentOppsummeringMock.mockRejectedValue(new Error("Kunne ikke hente oppsummering"));

    const resultat = await loader(args);
    if (resultat.type !== "saksbehandler") throw new Error("Forventet saksbehandler");

    expect(resultat.velkomstOppsummering).toBeNull();
    expect(resultat.mineSaker).toEqual([]);
  });

  it("sender utløpt sesjon videre", async () => {
    hentOppsummeringMock.mockRejectedValue(data("Sesjonen er utløpt.", { status: 401 }));

    await expect(loader(args)).rejects.toMatchObject({ init: { status: 401 } });
  });

  describe("melding om saker som skal flyttes fra Access", () => {
    const hentFlagg = async () => {
      hentOppsummeringMock.mockResolvedValue({ nye: 0, aktive: 0, venter: 0, iBero: 0 });
      const resultat = await loader(args);
      if (resultat.type !== "saksbehandler") throw new Error("Forventet saksbehandler");
      return resultat.harSakerSomSkalFlyttes;
    };

    it("spør ikke backend når migrering er stengt", async () => {
      expect(await hentFlagg()).toBe(false);
      expect(hentMigreringslisteMock).not.toHaveBeenCalled();
    });

    it("er sann når brukeren har saker som ikke er ferdig flyttet", async () => {
      miljøMock.ENVIRONMENT = "dev";
      hentMigreringslisteMock.mockResolvedValue({ totalAntall: 3 });

      expect(await hentFlagg()).toBe(true);
      expect(hentMigreringslisteMock).toHaveBeenCalledWith(args.request, "MINE", 1, 1, {
        status: ["IKKE_PABEGYNT", "UNDER_MIGRERING"],
      });
    });

    it("er usann uten saker", async () => {
      miljøMock.ENVIRONMENT = "dev";
      hentMigreringslisteMock.mockResolvedValue({ totalAntall: 0 });

      expect(await hentFlagg()).toBe(false);
    });

    it("skjuler meldingen i stedet for å felle forsiden når backend feiler", async () => {
      miljøMock.ENVIRONMENT = "dev";
      hentMigreringslisteMock.mockRejectedValue(new Error("nede"));

      expect(await hentFlagg()).toBe(false);
    });
  });
});
