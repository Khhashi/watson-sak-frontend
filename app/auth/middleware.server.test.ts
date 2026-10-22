import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStaticHandler, redirect, type MiddlewareFunction } from "react-router";
import { getValidToken } from "./access-token";
import { middleware } from "~/root";
import { RouteConfig } from "~/routeConfig";

const testState = vi.hoisted(() => ({ environment: "prod" }));

vi.mock("~/config/env.server", () => ({
  env: {
    get ENVIRONMENT() {
      return testState.environment;
    },
  },
}));
vi.mock("./access-token", () => ({ getValidToken: vi.fn() }));
vi.mock("~/layout/root", () => ({ default: () => null }));
vi.mock("~/layout/ErrorBoundary", () => ({ RootErrorBoundary: () => null }));
vi.mock("~/layout/loader.server", () => ({ rootLoader: vi.fn() }));
vi.mock("~/sikkerhet/headers", () => ({ sikkerhetHeaders: vi.fn() }));

function lagRuter(sti: string) {
  const loader = vi.fn(() => Response.json({ ok: true }));
  const action = vi.fn(() => Response.json({ ok: true }));
  const handler = createStaticHandler([
    {
      path: "/",
      middleware: middleware.map(
        (fn): MiddlewareFunction =>
          (args, next) =>
            fn(args, async () => {
              const respons = await next();
              if (!(respons instanceof Response)) {
                throw new TypeError("Testadapteren forventer en Response");
              }
              return respons;
            }),
      ),
      children: [{ path: sti, loader, action }],
    },
  ]);

  return {
    loader,
    action,
    async kall(metode = "GET", urlSti = sti) {
      const request = new Request(`https://watson.example${urlSti}`, { method: metode });
      return handler.queryRoute(request, {
        generateMiddlewareResponse: (query) => query(request),
      });
    },
    async kallData(metode = "GET") {
      const request = new Request(`https://watson.example${sti}.data?_routes=0-0`, {
        method: metode,
      });
      const respons = await handler.query(request, {
        normalizePath: () => ({ pathname: sti, search: "", hash: "" }),
        generateMiddlewareResponse: async (query) => {
          const resultat = await query(request);
          return resultat instanceof Response
            ? resultat
            : Response.json(resultat.loaderData, { status: resultat.statusCode });
        },
      });
      if (!(respons instanceof Response)) {
        throw new TypeError("Testadapteren forventer en Response");
      }
      return respons;
    },
  };
}

describe("innlogging før loaders og actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testState.environment = "prod";
    vi.mocked(getValidToken).mockRejectedValue(redirect("/oauth2/login"));
  });

  it.each(["prod", "dev", "demo"])(
    "avviser beskyttede API-kall før handleren i %s",
    async (miljø) => {
      testState.environment = miljø;
      for (const sti of [
        RouteConfig.API.PREFERENCES,
        RouteConfig.API.PERSON_OPPSLAG,
        RouteConfig.API.RESET_MOCK_DATA,
        RouteConfig.API.VARSLER_ULESTE,
        RouteConfig.API.MARKER_VARSEL_LEST,
        RouteConfig.API.OPPGAVEKODEVERK.replace(":tema", "DAG"),
        RouteConfig.API.SAK_FIL.replace(":sakId", "42").replace(":filId", "fil"),
      ]) {
        const ruter = lagRuter(sti);
        for (const metode of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
          const respons = await ruter.kall(metode);
          expect(respons.status).toBe(401);
        }
        expect(ruter.loader).not.toHaveBeenCalled();
        expect(ruter.action).not.toHaveBeenCalled();
      }
    },
  );

  it.each(["GET", "POST"])("krever innlogging på sider ved %s", async (metode) => {
    const ruter = lagRuter(RouteConfig.REGISTRER_SAK);
    const respons = await ruter.kall(metode);
    expect(respons.status).toBe(302);
    expect(respons.headers.get("Location")).toBe("/oauth2/login");
    expect(ruter.loader).not.toHaveBeenCalled();
    expect(ruter.action).not.toHaveBeenCalled();
  });

  it("sender forhåndsutfylling til innlogging før cookien kan settes", async () => {
    const ruter = lagRuter(RouteConfig.API.FORHÅNDSUTFYLL_REGISTRER_SAK);
    const respons = await ruter.kall("POST");
    expect(respons.status).toBe(302);
    expect(respons.headers.get("Location")).toBe("/oauth2/login");
    expect(respons.headers.get("Set-Cookie")).toBeNull();
    expect(ruter.action).not.toHaveBeenCalled();
  });

  it.each(["GET", "POST"])("slipper gjennom autentiserte kall ved %s", async (metode) => {
    vi.mocked(getValidToken).mockResolvedValue("gyldig-token");
    const ruter = lagRuter(RouteConfig.API.PREFERENCES);
    const respons = await ruter.kall(metode);
    expect(respons.status).toBe(200);
    expect(getValidToken).toHaveBeenCalledWith(expect.any(Request));
    expect(metode === "GET" ? ruter.loader : ruter.action).toHaveBeenCalledOnce();
  });

  it("lar lokal mock fungere uten token", async () => {
    testState.environment = "local-mock";
    const ruter = lagRuter(RouteConfig.API.PERSON_OPPSLAG);
    expect((await ruter.kall("POST")).status).toBe(200);
    expect(getValidToken).not.toHaveBeenCalled();
    expect(ruter.action).toHaveBeenCalledOnce();
  });

  it.each(["GET", "POST"])("beskytter også målrettede .data-kall ved %s", async (metode) => {
    const ruter = lagRuter(RouteConfig.REGISTRER_SAK);
    const respons = await ruter.kallData(metode);
    expect(respons.status).toBe(302);
    expect(ruter.loader).not.toHaveBeenCalled();
    expect(ruter.action).not.toHaveBeenCalled();
  });

  it.each([RouteConfig.API.HEALTH, RouteConfig.API.VERSION, RouteConfig.WELL_KNOWN.SECURITY_TXT])(
    "beholder %s offentlig, også med query og avsluttende skråstrek",
    async (sti) => {
      const ruter = lagRuter(sti);
      expect((await ruter.kall("GET", `${sti}/?backend=true`)).status).toBe(200);
      expect(getValidToken).not.toHaveBeenCalled();
    },
  );

  it("lar ikke offentlige stiprefikser unnta andre ruter", async () => {
    const ruter = lagRuter(`${RouteConfig.API.HEALTH}/privat`);
    expect((await ruter.kall()).status).toBe(401);
    expect(ruter.loader).not.toHaveBeenCalled();
  });

  it("skjuler ikke uventede feil i tokenvalideringen som utlogget sesjon", async () => {
    const feil = new Error("Tokenvalideringen feilet");
    vi.mocked(getValidToken).mockRejectedValue(feil);
    const ruter = lagRuter(RouteConfig.API.PREFERENCES);
    await expect(ruter.kall("POST")).rejects.toThrow(feil);
    expect(ruter.action).not.toHaveBeenCalled();
  });
});
