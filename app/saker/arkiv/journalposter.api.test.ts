import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSaksreferanse } from "~/saker/id";
import type { KontrollsakSaksbehandler } from "~/saker/types.backend";
import { hentFordelingssaker } from "~/testing/mock-store/alle-saker.server";
import { leggTilJournalpost } from "~/testing/mock-store/journalposter.server";
import { hentMockState, resetDefaultSession } from "~/testing/mock-store/session.server";
import type { Route } from "./+types/journalposter.api";
import { loader } from "./journalposter.api";

vi.mock("~/config/env.server", () => ({
  skalBrukeMockdata: true,
  env: { ENVIRONMENT: "local-mock" },
}));

vi.mock("~/auth/innlogget-bruker.server", () => ({
  hentInnloggetBruker: async () => ({
    navIdent: "Z999999",
    name: "Test Saksbehandler",
    preferredUsername: "test@nav.no",
    enhet: "4812",
  }),
}));

const testRequest = new Request("http://localhost");
const meg: KontrollsakSaksbehandler = { navIdent: "Z999999", navn: "Test", enhet: "4812" };

function settOppSak(eier: boolean) {
  const sak = hentFordelingssaker(hentMockState(testRequest))[0];
  sak.saksbehandlere.eier = eier ? meg : { ...meg, navIdent: "Z111111" };
  sak.saksbehandlere.deltMed = [];
  return getSaksreferanse(sak.id);
}

async function hent(sakId: string) {
  return loader({ request: testRequest, params: { sakId } } as Route.LoaderArgs);
}

describe("journalposter.api – mockdata", () => {
  beforeEach(() => {
    resetDefaultSession();
  });

  it("returnerer mockjournalposter når brukeren kan lese saken", async () => {
    const resultat = await hent(settOppSak(true));

    expect(resultat).toMatchObject({ status: "ok" });
    expect((resultat as { journalposter: unknown[] }).journalposter.length).toBeGreaterThan(0);
  });

  it("tar med journalposter som er opprettet fra saken i sesjonen", async () => {
    const sakId = settOppSak(true);
    const sak = hentFordelingssaker(hentMockState(testRequest))[0];
    leggTilJournalpost(hentMockState(testRequest), String(sak.id), {
      journalpostId: "ny-1",
      journalposttype: "UTGAAENDE",
      tittel: "Varsel om kontroll",
      opprettet: "2099-01-01T10:00:00Z",
    });

    const resultat = (await hent(sakId)) as { journalposter: Array<Record<string, unknown>> };

    expect(resultat.journalposter[0]).toMatchObject({
      journalpostId: "ny-1",
      journalposttype: "U",
      tittel: "Varsel om kontroll",
    });
    expect(resultat.journalposter.length).toBeGreaterThan(1);
  });

  it("returnerer tom liste når brukeren ikke kan lese saken, som backend", async () => {
    const resultat = await hent(settOppSak(false));

    expect(resultat).toEqual({ status: "ok", journalposter: [] });
  });
});
