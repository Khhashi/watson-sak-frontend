import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Tema } from "./tema";
import { tømOppgavekodeverkHurtiglager, useOppgavekodeverk } from "./useOppgavekodeverk";

const kodeverk = {
  gjelderverdier: [{ behandlingstema: "ab0356", behandlingstemaTerm: "Dagpenger" }],
  oppgavetyper: [{ oppgavetype: "VUR", term: "Vurder dokument" }],
};

function svar(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

describe("useOppgavekodeverk", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    tømOppgavekodeverkHurtiglager();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("henter ingenting før tema er valgt", () => {
    const { result } = renderHook(() => useOppgavekodeverk(undefined));

    expect(result.current.tilstand).toEqual({ status: "uten-tema" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("henter hvert tema én gang", async () => {
    fetchMock.mockImplementation(async () => svar({ status: "ok", kodeverk }));
    const { result, rerender } = renderHook(({ tema }) => useOppgavekodeverk(tema), {
      initialProps: { tema: "KTR" as Tema },
    });

    await waitFor(() => expect(result.current.tilstand).toEqual({ status: "ok", kodeverk }));
    rerender({ tema: "KTA" });
    await waitFor(() => expect(result.current.tilstand.status).toBe("ok"));
    rerender({ tema: "KTR" });

    expect(result.current.tilstand).toEqual({ status: "ok", kodeverk });
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/kodeverk/oppgave/KTR",
      "/api/kodeverk/oppgave/KTA",
    ]);
  });

  it("viser feil og henter på nytt når saksbehandleren prøver igjen", async () => {
    fetchMock.mockResolvedValueOnce(svar({ status: "feil" }, 502));
    const { result } = renderHook(() => useOppgavekodeverk("KTR"));
    await waitFor(() => expect(result.current.tilstand).toEqual({ status: "feil" }));

    fetchMock.mockResolvedValueOnce(svar({ status: "ok", kodeverk }));
    act(() => result.current.prøvIgjen());

    expect(result.current.tilstand).toEqual({ status: "laster" });
    await waitFor(() => expect(result.current.tilstand).toEqual({ status: "ok", kodeverk }));
  });
});
