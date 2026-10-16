import { data } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Route } from "./+types/journalposter.api";

const mockHentArkivJournalposter = vi.fn();
const mockLoggerError = vi.fn();

vi.mock("~/config/env.server", () => ({ skalBrukeMockdata: false }));
vi.mock("~/auth/access-token", () => ({
  getBackendOboToken: vi.fn().mockResolvedValue("mock-token"),
}));
vi.mock("~/logging/logging", () => ({
  logger: { error: mockLoggerError, warn: vi.fn(), info: vi.fn() },
}));
vi.mock("./api.server", () => ({ hentArkivJournalposter: mockHentArkivJournalposter }));

class MockBackendFeil extends Error {
  constructor(public readonly status: number) {
    super("feil");
  }
}

async function kjørLoader(sakId = "14") {
  const { loader } = await import("./journalposter.api");
  return loader({
    request: new Request("http://localhost"),
    params: { sakId },
  } as Route.LoaderArgs);
}

function somDataMedInit(verdi: unknown) {
  return verdi as { data: unknown; init: { status: number } };
}

describe("journalposter.api – backend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returnerer journalpostene fra backend", async () => {
    mockHentArkivJournalposter.mockResolvedValue([{ journalpostId: "1" }]);

    const resultat = await kjørLoader();

    expect(mockHentArkivJournalposter).toHaveBeenCalledWith("mock-token", "14");
    expect(resultat).toEqual({ status: "ok", journalposter: [{ journalpostId: "1" }] });
  });

  it("returnerer en håndterbar feil når Gosys er utilgjengelig", async () => {
    mockHentArkivJournalposter.mockRejectedValue(new MockBackendFeil(503));

    const resultat = somDataMedInit(await kjørLoader());

    expect(resultat.init.status).toBe(503);
    expect(resultat.data).toEqual({ status: "feil", årsak: "utilgjengelig" });
  });

  it("returnerer egen feil ved for mange forespørsler", async () => {
    mockHentArkivJournalposter.mockRejectedValue(data("For mange", { status: 429 }));

    const resultat = somDataMedInit(await kjørLoader());

    expect(resultat.init.status).toBe(429);
    expect(resultat.data).toEqual({ status: "feil", årsak: "for-mange-forespørsler" });
  });

  it("returnerer håndterbar feil og logger uten detaljer ved ugyldig svar", async () => {
    mockHentArkivJournalposter.mockRejectedValue(new Error("Ugyldig svar"));

    const resultat = somDataMedInit(await kjørLoader());

    expect(resultat.data).toEqual({ status: "feil", årsak: "utilgjengelig" });
    expect(mockLoggerError).toHaveBeenCalledWith(
      "Uventet feil ved henting av journalposter fra Gosys",
    );
  });

  it("kaster utløpt sesjon videre", async () => {
    const utlogget = data("Utløpt", { status: 401 });
    mockHentArkivJournalposter.mockRejectedValue(utlogget);

    await expect(kjørLoader()).rejects.toBe(utlogget);
  });

  it("avviser ugyldig sak-ID uten å kalle backend", async () => {
    await expect(kjørLoader("../1")).rejects.toMatchObject({ init: { status: 404 } });
    expect(mockHentArkivJournalposter).not.toHaveBeenCalled();
  });
});
