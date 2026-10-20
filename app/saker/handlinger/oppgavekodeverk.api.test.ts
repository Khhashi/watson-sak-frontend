import { data } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Route } from "./+types/oppgavekodeverk.api";

const mockHentOppgavekodeverk = vi.fn();

vi.mock("~/config/env.server", () => ({ skalBrukeMockdata: false }));
vi.mock("~/auth/access-token", () => ({ getBackendOboToken: async () => "mock-token" }));
vi.mock("~/logging/logging", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));
vi.mock("~/saker/api.server", () => ({ hentOppgavekodeverk: mockHentOppgavekodeverk }));

async function kjørLoader(tema: string) {
  const { loader } = await import("./oppgavekodeverk.api");
  return loader({
    request: new Request("http://localhost"),
    params: { tema },
  } as Route.LoaderArgs);
}

describe("oppgavekodeverk.api", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returnerer kodeverket for temaet fra backend", async () => {
    const kodeverk = { gjelderverdier: [], oppgavetyper: [{ oppgavetype: "VUR", term: "Vurder" }] };
    mockHentOppgavekodeverk.mockResolvedValue(kodeverk);

    const resultat = await kjørLoader("KTA");

    expect(mockHentOppgavekodeverk).toHaveBeenCalledWith("mock-token", "KTA");
    expect(resultat).toEqual({ status: "ok", kodeverk });
  });

  it("avviser ukjent tema uten å kalle backend", async () => {
    const feil = await kjørLoader("ABC").catch((e: unknown) => e);

    expect(feil).toMatchObject({ init: { status: 400 } });
    expect(mockHentOppgavekodeverk).not.toHaveBeenCalled();
  });

  it("returnerer en håndterbar feil når Oppgave API er utilgjengelig", async () => {
    mockHentOppgavekodeverk.mockRejectedValue(data("Bad gateway", { status: 502 }));

    const resultat = await kjørLoader("KTR");

    expect(resultat).toMatchObject({ data: { status: "feil" }, init: { status: 502 } });
  });

  it("kaster utløpt sesjon videre", async () => {
    mockHentOppgavekodeverk.mockRejectedValue(data("Utlogget", { status: 401 }));

    await expect(kjørLoader("KTR")).rejects.toMatchObject({ init: { status: 401 } });
  });
});
