import type { LoaderFunctionArgs } from "react-router";
import { RouterContextProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  isDev: true,
  environment: "local-backend",
}));

const hentInnloggetBrukerMock = vi.hoisted(() => vi.fn());
const getBackendOboTokenMock = vi.hoisted(() => vi.fn());

vi.mock("~/config/env.server", () => ({
  get env() {
    return {
      get ENVIRONMENT() {
        return testState.environment;
      },
    };
  },
  get isDev() {
    return testState.isDev;
  },
}));

vi.mock("~/auth/innlogget-bruker.server", () => ({
  hentInnloggetBruker: hentInnloggetBrukerMock,
}));

vi.mock("~/auth/access-token", () => ({
  getBackendOboToken: getBackendOboTokenMock,
}));

describe("innlogget-bruker-api", () => {
  function lagLoaderArgs(): LoaderFunctionArgs {
    return {
      request: new Request("http://localhost/api/logged-in-user"),
      params: {},
      context: new RouterContextProvider(),
      pattern: "/api/logged-in-user",
      url: new URL("http://localhost/api/logged-in-user"),
    };
  }

  async function kjørLoader() {
    const { loader } = await import("./api");
    return loader(lagLoaderArgs());
  }

  beforeEach(() => {
    vi.clearAllMocks();
    testState.isDev = true;
    testState.environment = "local-backend";
    hentInnloggetBrukerMock.mockResolvedValue({
      preferredUsername: "test@nav.no",
      name: "Test Saksbehandler",
      navIdent: "S162301",
      enhet: "4812",
    });
    getBackendOboTokenMock.mockResolvedValue("obo-token");
  });

  it("returnerer backend-token for godkjent bruker i dev", async () => {
    const result = await kjørLoader();

    expect(getBackendOboTokenMock).toHaveBeenCalledWith(expect.any(Request));
    expect(result.headers.get("Cache-Control")).toBe("no-store");
    await expect(result.json()).resolves.toEqual({
      preferredUsername: "test@nav.no",
      name: "Test Saksbehandler",
      navIdent: "S162301",
      enhet: "4812",
      token: "obo-token",
    });
  });

  it("hopper over token i local-mock", async () => {
    testState.environment = "local-mock";

    const result = await kjørLoader();

    expect(getBackendOboTokenMock).not.toHaveBeenCalled();
    await expect(result.json()).resolves.toEqual({
      preferredUsername: "test@nav.no",
      name: "Test Saksbehandler",
      navIdent: "S162301",
      enhet: "4812",
    });
  });

  it.each(["dev", "local-backend", "local-dev"])("gir token i %s", async (miljø) => {
    testState.environment = miljø;

    const result = await kjørLoader();

    await expect(result.json()).resolves.toMatchObject({ token: "obo-token" });
  });

  it.each(["prod", "demo"])("svarer 404 uten å hente bruker eller token i %s", async (miljø) => {
    testState.environment = miljø;

    const feil = await kjørLoader().catch((e: unknown) => e);

    if (!(feil instanceof Response)) {
      throw new Error("Forventet at loaderen kaster en Response");
    }
    expect(feil.status).toBe(404);
    expect(hentInnloggetBrukerMock).not.toHaveBeenCalled();
    expect(getBackendOboTokenMock).not.toHaveBeenCalled();
  });

  it.each(["Z993376", "Z993741", "Z993471", "Z990474", "B126228"])(
    "gir tilgang til %s",
    async (navIdent) => {
      hentInnloggetBrukerMock.mockResolvedValue({
        preferredUsername: "test@nav.no",
        name: "Test Saksbehandler",
        navIdent,
        enhet: "4812",
      });

      const result = await kjørLoader();

      await expect(result.json()).resolves.toMatchObject({ navIdent, token: "obo-token" });
    },
  );

  it.each(["M118946", "H139079"])("avviser tidligere godkjent bruker %s", async (navIdent) => {
    hentInnloggetBrukerMock.mockResolvedValue({
      preferredUsername: "tidligere@nav.no",
      name: "Tidligere godkjent bruker",
      navIdent,
      enhet: "4812",
    });

    const result = await kjørLoader();

    expect(result.status).toBe(403);
  });

  it("avviser brukere som ikke har tilgang", async () => {
    hentInnloggetBrukerMock.mockResolvedValue({
      preferredUsername: "annen@nav.no",
      name: "Annen Saksbehandler",
      navIdent: "Z111111",
      enhet: "4812",
    });

    const result = await kjørLoader();

    expect(getBackendOboTokenMock).not.toHaveBeenCalled();
    expect(result.status).toBe(403);
    await expect(result.json()).resolves.toEqual({ error: "Du har ikke tilgang" });
  });
});
