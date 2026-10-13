import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LoaderFunctionArgs } from "react-router";
import { skalBrukeMockdataForMiljø, type Miljø } from "~/config/backend-config";
import type { MigreringKandidat } from "./types";

const mocks = vi.hoisted(() => ({
  mockmodus: true,
  miljø: "local-mock" as Miljø,
  bruker: vi.fn(),
  kandidater: vi.fn(),
  backend: vi.fn(),
  ansatte: vi.fn(),
  tildel: vi.fn(),
}));
vi.mock("~/config/env.server", () => ({
  get skalBrukeMockdata() {
    return mocks.mockmodus;
  },
  get env() {
    return { ENVIRONMENT: mocks.miljø };
  },
}));
vi.mock("~/auth/innlogget-bruker.server", () => ({ hentInnloggetBruker: mocks.bruker }));
vi.mock("./mock-data.server", () => ({ hentMockMigreringKandidater: mocks.kandidater }));
vi.mock("./api.server", () => ({
  hentMigreringsliste: mocks.backend,
  hentMigreringsAnsatte: mocks.ansatte,
  tildelMigreringskandidat: mocks.tildel,
}));

import { action, lesFilter, loader } from "./MigreringSide.server";

const ingenFilter = { status: [], enhet: null, ansvarlig: null };

const basis: MigreringKandidat = {
  kandidatId: "UTREDNING:100245",
  kilde: "UTREDNING",
  legacyKilde: "UTREDNING",
  pid: "100245",
  legacyPid: "100245",
  kategori: "TIPS_RESTANSE",
  navn: "Eksempel",
  ansvar: { type: "BEKREFTET", navIdent: "L999999" },
  enhet: "4812",
  vurdering: "MULIG_KANDIDAT",
  ekskluderFraStatistikk: false,
  referansedato: "2023-01-01",
  referansedatoFelt: "TIPSINNDATO",
  fase: "Utredning",
  begrunnelse: "Eksempel",
  kildefelter: [],
};
function args() {
  return {
    request: new Request("http://localhost/migrering?navIdent=Z000001"),
    params: {},
    context: {},
  } as LoaderFunctionArgs;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mockmodus = true;
  mocks.miljø = "local-mock";
  mocks.ansatte.mockResolvedValue([]);
  mocks.bruker.mockResolvedValue({ navIdent: "L999999" });
  mocks.kandidater.mockReturnValue([
    basis,
    { ...basis, pid: "100246", ansvar: { type: "BEKREFTET", navIdent: "Z000001" } },
    { ...basis, pid: "100247", ansvar: { type: "LOGGTREFF", navIdent: "L999999" } },
    { ...basis, pid: "100248", ansvar: { type: "UKJENT" } },
  ]);
});

const side = (
  kandidater: MigreringKandidat[],
  sideNr = 1,
  totalSider = 1,
  totalAntall = kandidater.length,
) => ({
  kandidater,
  utilgjengelig: false,
  side: sideNr,
  totalSider,
  totalAntall,
});
const tomSide = { kandidater: [], side: 1, totalSider: 0, totalAntall: 0 };

describe("Migreringsprototypens loader", () => {
  it.each<Miljø>(["prod", "local-dev"])("avviser %s før data hentes", async (miljø) => {
    mocks.miljø = miljø;
    mocks.mockmodus = skalBrukeMockdataForMiljø(miljø);
    await expect(loader(args())).rejects.toMatchObject({ status: 404 });
    expect(mocks.bruker).not.toHaveBeenCalled();
    expect(mocks.kandidater).not.toHaveBeenCalled();
    expect(mocks.backend).not.toHaveBeenCalled();
  });

  it.each<Miljø>(["local-backend", "dev"])("bruker beskyttet backend-API i %s", async (miljø) => {
    mocks.miljø = miljø;
    mocks.mockmodus = false;
    mocks.backend.mockResolvedValue(side([basis]));
    mocks.bruker.mockResolvedValue({ navIdent: "L999999", erLeder: false });
    const argumenter = args();

    const resultat = await loader(argumenter);

    expect(mocks.backend).toHaveBeenCalledTimes(1);
    expect(mocks.backend).toHaveBeenCalledWith(argumenter.request, "MINE", 1, 20, { status: [] });
    expect(mocks.kandidater).not.toHaveBeenCalled();
    expect(resultat.liste.kandidater.map((k) => k.kandidatId)).toEqual(["UTREDNING:100245"]);
    expect(resultat.utilgjengelig).toBe(false);
  });

  it("henter samlet liste og ansattvalg for ledere", async () => {
    mocks.miljø = "local-backend";
    mocks.mockmodus = false;
    mocks.bruker.mockResolvedValue({ navIdent: "L999999", erLeder: true });
    mocks.backend.mockResolvedValue(side([{ ...basis, personIdent: null }]));

    const resultat = await loader(args());

    expect(mocks.backend).toHaveBeenCalledTimes(1);
    expect(mocks.backend).toHaveBeenCalledWith(expect.anything(), "ALLE", 1, 20, ingenFilter);
    expect(mocks.ansatte).toHaveBeenCalledTimes(1);
    expect(resultat.liste.kandidater).toHaveLength(1);
  });

  it("henter siden fra URL-en", async () => {
    mocks.miljø = "local-backend";
    mocks.mockmodus = false;
    mocks.bruker.mockResolvedValue({ navIdent: "L999999", erLeder: true });
    mocks.backend.mockImplementation(async (_r: Request, _v: string, sideNr: number) =>
      side([basis], sideNr, 5, 100),
    );

    await loader({
      request: new Request("http://localhost/migrering?side=3"),
      params: {},
      context: {},
    } as LoaderFunctionArgs);

    expect(mocks.backend).toHaveBeenCalledWith(expect.anything(), "ALLE", 3, 20, ingenFilter);
  });

  it.each(["0", "-4", "abc", "", "3abc", "99999999999999999999"])(
    "ugyldig sideparameter «%s» gir side 1",
    async (verdi) => {
      mocks.miljø = "local-backend";
      mocks.mockmodus = false;
      mocks.bruker.mockResolvedValue({ navIdent: "L999999", erLeder: false });
      mocks.backend.mockResolvedValue(side([basis]));

      await loader({
        request: new Request(`http://localhost/migrering?side=${verdi}`),
        params: {},
        context: {},
      } as LoaderFunctionArgs);

      expect(mocks.backend).toHaveBeenCalledWith(expect.anything(), "MINE", 1, 20, { status: [] });
    },
  );

  it("viser siste side når siden i URL-en er forbi siste side", async () => {
    mocks.miljø = "local-backend";
    mocks.mockmodus = false;
    mocks.bruker.mockResolvedValue({ navIdent: "L999999", erLeder: false });
    mocks.backend.mockImplementation(async (_r: Request, _v: string, sideNr: number) =>
      sideNr > 2 ? side([], sideNr, 2, 30) : side([basis], sideNr, 2, 30),
    );

    const resultat = await loader({
      request: new Request("http://localhost/migrering?side=9"),
      params: {},
      context: {},
    } as LoaderFunctionArgs);

    expect(mocks.backend).toHaveBeenCalledWith(expect.anything(), "MINE", 9, 20, { status: [] });
    expect(mocks.backend).toHaveBeenCalledWith(expect.anything(), "MINE", 2, 20, { status: [] });
    expect(resultat.liste.side).toBe(2);
  });

  it("gir tom liste og utilgjengelig når backend feiler, men bevarer utløpt sesjon", async () => {
    mocks.miljø = "local-backend";
    mocks.mockmodus = false;
    mocks.bruker.mockResolvedValue({ navIdent: "L999999", erLeder: false });
    mocks.backend.mockRejectedValueOnce(new Response(null, { status: 502 }));

    const resultat = await loader(args());
    expect(resultat).toEqual({
      liste: tomSide,
      ansatteValg: [],
      filter: ingenFilter,
      erLeder: false,
      utilgjengelig: true,
    });

    mocks.backend.mockRejectedValueOnce(new Response(null, { status: 401 }));
    await expect(loader(args())).rejects.toMatchObject({ status: 401 });
  });

  it.each<Miljø>(["local-mock", "demo"])("tillater prototypen i %s", async (miljø) => {
    mocks.miljø = miljø;
    mocks.mockmodus = skalBrukeMockdataForMiljø(miljø);
    expect((await loader(args())).liste.kandidater).toHaveLength(1);
  });

  it("bruker ident fra innlogging, ikke queryparameter, og returnerer ikke andres bekreftede saker", async () => {
    const resultat = await loader(args());
    expect(mocks.kandidater).toHaveBeenCalledWith("L999999");
    expect(resultat.liste.kandidater.map((k) => k.pid)).toEqual(["100245"]);
    expect(JSON.stringify(resultat)).not.toContain("100246");
  });

  it("søkeloggtreff er ikke eierskap, selv for innlogget bruker", async () => {
    const resultat = await loader(args());
    expect(resultat.liste.kandidater.map((k) => k.pid)).toEqual(["100245"]);
    expect(resultat.liste.kandidater.every((k) => k.ansvar.type === "BEKREFTET")).toBe(true);
  });

  it("deler mock-data i sider og viser siste side når siden er for høy", async () => {
    const mange = Array.from({ length: 45 }, (_, i) => ({
      ...basis,
      pid: String(100000 + i),
      kandidatId: `UTREDNING:${100000 + i}`,
      legacyPid: String(100000 + i),
    }));
    mocks.kandidater.mockReturnValue(mange);

    const forste = await loader(args());
    expect(forste.liste.kandidater).toHaveLength(20);
    expect(forste.liste.totalSider).toBe(3);
    expect(forste.liste.totalAntall).toBe(45);

    const forHoy = await loader({
      request: new Request("http://localhost/migrering?side=99"),
      params: {},
      context: {},
    } as LoaderFunctionArgs);
    expect(forHoy.liste.side).toBe(3);
    expect(forHoy.liste.kandidater).toHaveLength(5);
  });

  it("bevarer autentiseringsfeil og henter ikke kandidater ved feil", async () => {
    mocks.bruker.mockRejectedValue(new Response(null, { status: 401 }));
    await expect(loader(args())).rejects.toMatchObject({ status: 401 });
    expect(mocks.kandidater).not.toHaveBeenCalled();
  });

  it("sender alle filtre til ALLE for ledere", async () => {
    mocks.miljø = "local-backend";
    mocks.mockmodus = false;
    mocks.bruker.mockResolvedValue({ navIdent: "L999999", erLeder: true });
    mocks.backend.mockResolvedValue(side([]));

    await loader({
      request: new Request(
        "http://localhost/migrering?status=UNDER_MIGRERING&enhet=4812&ansvarlig=Z000001",
      ),
      params: {},
      context: {},
    } as LoaderFunctionArgs);

    expect(mocks.backend).toHaveBeenCalledWith(expect.anything(), "ALLE", 1, 20, {
      status: ["UNDER_MIGRERING"],
      enhet: "4812",
      ansvarlig: "Z000001",
    });
  });

  it("henter ikke ansattvalg for vanlige saksbehandlere", async () => {
    mocks.miljø = "local-backend";
    mocks.mockmodus = false;
    mocks.bruker.mockResolvedValue({ navIdent: "Z000001", erLeder: false });
    mocks.backend.mockResolvedValue(side([]));

    await loader(args());

    expect(mocks.ansatte).not.toHaveBeenCalled();
  });

  it("filtrerer mine saker på status i mockmodus", async () => {
    const resultat = await loader({
      request: new Request("http://localhost/migrering?status=FULLSTENDIG"),
      params: {},
      context: {},
    } as LoaderFunctionArgs);
    expect(resultat.liste.kandidater).toHaveLength(0);
  });
});

describe("lesFilter", () => {
  it("godtar kjente statuser og identer", () => {
    expect(
      lesFilter(
        new URL(
          "http://x/m?status=IKKE_PABEGYNT&status=UNDER_MIGRERING&enhet=4812&ansvarlig=Z000001",
        ),
      ),
    ).toEqual({
      status: ["IKKE_PABEGYNT", "UNDER_MIGRERING"],
      enhet: "4812",
      ansvarlig: "Z000001",
    });
  });

  it("ignorerer ukjente statuser og ugyldige identer", () => {
    expect(lesFilter(new URL("http://x/m?status=HEI&enhet=a%20b&ansvarlig=%3Cscript%3E"))).toEqual(
      ingenFilter,
    );
  });
});

describe("tildelingsaction", () => {
  function skjema(verdier: Record<string, string>) {
    const body = new URLSearchParams(verdier);
    return {
      request: new Request("http://localhost/migrering", { method: "POST", body }),
      params: {},
      context: {},
    } as Parameters<typeof action>[0];
  }
  const gyldig = { kandidatId: "UTREDNING:100245", navIdent: "Z999002" };

  beforeEach(() => {
    mocks.miljø = "local-backend";
    mocks.mockmodus = false;
    mocks.bruker.mockResolvedValue({ navIdent: "L999999", erLeder: true });
  });

  it("avviser ikke-ledere med 403", async () => {
    mocks.bruker.mockResolvedValue({ navIdent: "Z000001", erLeder: false });
    await expect(action(skjema(gyldig))).rejects.toMatchObject({ init: { status: 403 } });
    expect(mocks.tildel).not.toHaveBeenCalled();
  });

  it.each([
    { ...gyldig, kandidatId: "UTREDNING:abc" },
    { ...gyldig, kandidatId: "ANNET:1" },
    { ...gyldig, navIdent: "ikke-ident" },
    { kandidatId: gyldig.kandidatId },
  ])("avviser ugyldig input med 400", async (verdier) => {
    await expect(action(skjema(verdier))).rejects.toMatchObject({ init: { status: 400 } });
    expect(mocks.tildel).not.toHaveBeenCalled();
  });

  it("kaller backend og svarer ok", async () => {
    mocks.tildel.mockResolvedValue(undefined);
    const forespørsel = skjema(gyldig);

    expect(await action(forespørsel)).toEqual({ ok: true });
    expect(mocks.tildel).toHaveBeenCalledWith(forespørsel.request, "UTREDNING:100245", "Z999002");
  });

  it("gir en lesbar feil ved 409 og 403/404 fra backend", async () => {
    mocks.tildel.mockRejectedValueOnce(new Response(null, { status: 409 }));
    expect(await action(skjema(gyldig))).toMatchObject({
      ok: false,
      feil: expect.stringMatching(/påbegynt/),
    });

    mocks.tildel.mockRejectedValueOnce(new Response(null, { status: 404 }));
    expect(await action(skjema(gyldig))).toMatchObject({ ok: false });
  });

  it("sender utløpt sesjon og andre feil videre", async () => {
    mocks.tildel.mockRejectedValueOnce(new Response(null, { status: 401 }));
    await expect(action(skjema(gyldig))).rejects.toMatchObject({ status: 401 });

    mocks.tildel.mockRejectedValueOnce(new Response(null, { status: 502 }));
    await expect(action(skjema(gyldig))).rejects.toMatchObject({ status: 502 });
  });

  it("stenger tildeling i prod", async () => {
    mocks.miljø = "prod";
    await expect(action(skjema(gyldig))).rejects.toMatchObject({ init: { status: 404 } });
  });
});
