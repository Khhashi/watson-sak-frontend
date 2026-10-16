import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GosysDokumentpanel } from "./GosysDokumentpanel";
import type { ArkivJournalpost, OpprettetJournalpost } from "./typer";
import { SYNK_FORSINKELSER_MS } from "./useArkivJournalposter";

const mockFetch = vi.fn();

const journalpost: ArkivJournalpost = {
  journalpostId: "jp-1",
  datoOpprettet: "2026-10-12T09:00:00",
  journalposttype: "I",
  journalstatus: "JOURNALFOERT",
  tittel: "Svarbrev om kontoopplysninger",
  tema: "KTR",
  temanavn: "Kontroll",
  avsenderMottaker: { id: null, type: null, navn: "Banken", erLikBruker: false },
  dokumenter: [
    { dokumentInfoId: "d-1", tittel: "Brev fra banken" },
    { dokumentInfoId: "d-2", tittel: "Kontoutskrift" },
  ],
};

function svar(body: unknown, status = 200) {
  return Promise.resolve(Response.json(body, { status }));
}

function renderPanel(props: Partial<Parameters<typeof GosysDokumentpanel>[0]> = {}) {
  return render(<GosysDokumentpanel sakId="14" saksreferanse="14" kanSeArkiv={true} {...props} />);
}

function åpneOversikt() {
  fireEvent.click(screen.getByRole("button", { name: "Vis dokumentoversikt" }));
}

describe("GosysDokumentpanel", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
  });

  it("starter lukket og henter ikke før oversikten åpnes", () => {
    renderPanel();

    expect(
      screen.getByRole("heading", { name: "Dokumentoversikt i Gosys for sak 14" }),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "Vis dokumentoversikt" })).toHaveProperty(
      "ariaExpanded",
      "false",
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("henter og viser journalposter når oversikten åpnes, og henter ikke på nytt ved lukk og åpne", async () => {
    mockFetch.mockReturnValue(svar({ status: "ok", journalposter: [journalpost] }));
    renderPanel();

    åpneOversikt();

    expect(await screen.findByText("Svarbrev om kontoopplysninger")).toBeDefined();
    expect(mockFetch).toHaveBeenCalledWith("/api/saker/14/arkiv/journalposter", expect.anything());
    const rad = screen.getByText("Svarbrev om kontoopplysninger").closest("tr");
    if (!rad) throw new Error("Fant ikke tabellraden");
    expect(within(rad).getByText("12.10.2026")).toBeDefined();
    expect(within(rad).getByText("Journalført")).toBeDefined();
    expect(within(rad).getByText("Kontroll")).toBeDefined();
    expect(within(rad).getByText("Banken")).toBeDefined();
    expect(within(rad).getByText("Inngående")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Lukk dokumentoversikt" }));
    åpneOversikt();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("viser dokumentene i en journalpost når raden utvides", async () => {
    mockFetch.mockReturnValue(svar({ status: "ok", journalposter: [journalpost] }));
    renderPanel();
    åpneOversikt();

    const knapp = await screen.findByRole("button", {
      name: "Vis dokumenter for Svarbrev om kontoopplysninger",
    });
    expect(screen.queryByText("Brev fra banken")).toBeNull();

    fireEvent.click(knapp);

    expect(screen.getByText("Brev fra banken")).toBeDefined();
    expect(screen.getByText("Kontoutskrift")).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Skjul dokumenter for Svarbrev om kontoopplysninger" }),
    ).toHaveProperty("ariaExpanded", "true");
  });

  it("viser tomtilstand når saken ikke har journalposter", async () => {
    mockFetch.mockReturnValue(svar({ status: "ok", journalposter: [] }));
    renderPanel();
    åpneOversikt();

    expect(await screen.findByText("Ingen journalføringer å vise for denne saken.")).toBeDefined();
  });

  it("viser feilmelding og henter på nytt med Prøv igjen", async () => {
    mockFetch
      .mockReturnValueOnce(svar({ status: "feil", årsak: "utilgjengelig" }, 503))
      .mockReturnValueOnce(svar({ status: "ok", journalposter: [journalpost] }));
    renderPanel();
    åpneOversikt();

    expect(
      await screen.findByText("Kunne ikke hente dokumentoversikten fra Gosys. Prøv igjen."),
    ).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Prøv igjen" }));

    expect(await screen.findByText("Svarbrev om kontoopplysninger")).toBeDefined();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("viser egen melding ved for mange forespørsler", async () => {
    mockFetch.mockReturnValue(svar({ status: "feil", årsak: "for-mange-forespørsler" }, 429));
    renderPanel();
    åpneOversikt();

    expect(
      await screen.findByText(
        "Du har gjort for mange oppslag. Vent et par minutter og prøv igjen.",
      ),
    ).toBeDefined();
  });

  it("viser feilmelding når nettverkskallet feiler", async () => {
    mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));
    renderPanel();
    åpneOversikt();

    expect(
      await screen.findByText("Kunne ikke hente dokumentoversikten fra Gosys. Prøv igjen."),
    ).toBeDefined();
  });

  it("viser tilgangsmelding uten å hente når brukeren mangler arkivtilgang", () => {
    renderPanel({ kanSeArkiv: false });
    åpneOversikt();

    expect(
      screen.getByText("Du har ikke tilgang til dokumentoversikten i Gosys for denne saken."),
    ).toBeDefined();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("henter når tilgangen kommer mens oversikten er åpen", async () => {
    mockFetch.mockReturnValue(svar({ status: "ok", journalposter: [journalpost] }));
    const { rerender } = renderPanel({ kanSeArkiv: false });
    åpneOversikt();

    rerender(<GosysDokumentpanel sakId="14" saksreferanse="14" kanSeArkiv={true} />);

    expect(await screen.findByText("Svarbrev om kontoopplysninger")).toBeDefined();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("viser utløpt sesjon når innloggingen gir redirect", async () => {
    mockFetch.mockResolvedValue({ type: "opaqueredirect", status: 0 } as Response);
    renderPanel();
    åpneOversikt();

    expect(
      await screen.findByText("Sesjonen din er utløpt. Last inn siden på nytt for å logge inn."),
    ).toBeDefined();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ redirect: "manual" }),
    );
  });

  describe("når en journalpost er opprettet", () => {
    const opprettet: OpprettetJournalpost = {
      journalpostId: "jp-ny",
      journalposttype: "UTGAAENDE",
      tittel: "Varsel om kontroll",
      dokumenttitler: ["Varsel.pdf"],
    };
    const iGosys: ArkivJournalpost = {
      ...journalpost,
      journalpostId: "jp-ny",
      journalposttype: "U",
      tittel: "Varsel om kontroll",
    };

    afterEach(() => {
      vi.useRealTimers();
    });

    function renderMedHandlinger() {
      let varsle: (journalpost: OpprettetJournalpost) => void = () => {};
      renderPanel({
        renderHandlinger: ({ onJournalpostOpprettet }) => {
          varsle = onJournalpostOpprettet;
          return null;
        },
      });
      return (journalpost: OpprettetJournalpost) => act(() => varsle(journalpost));
    }

    function radFor(tittel: string) {
      const rad = screen.getByText(tittel).closest("tr");
      if (!rad) throw new Error(`Fant ikke raden for ${tittel}`);
      return rad;
    }

    async function ventPå(ms: number) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(ms);
      });
    }

    it("viser journalposten med en gang og synkroniserer med Gosys etter noen sekunder", async () => {
      mockFetch.mockReturnValueOnce(svar({ status: "ok", journalposter: [] }));
      const varsleOpprettet = renderMedHandlinger();
      åpneOversikt();
      await screen.findByText("Ingen journalføringer å vise for denne saken.");
      vi.useFakeTimers();

      await varsleOpprettet(opprettet);

      expect(within(radFor("Varsel om kontroll")).getByText("Venter på Gosys")).toBeDefined();
      expect(within(radFor("Varsel om kontroll")).getByText("Utgående")).toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      mockFetch.mockReturnValueOnce(svar({ status: "ok", journalposter: [iGosys] }));
      await ventPå(SYNK_FORSINKELSER_MS[0]);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(within(radFor("Varsel om kontroll")).getByText("Journalført")).toBeDefined();
      expect(screen.queryByText("Venter på Gosys")).toBeNull();

      await ventPå(60_000);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("prøver igjen og beholder listen når Gosys ikke har journalposten ennå eller feiler", async () => {
      mockFetch.mockReturnValueOnce(svar({ status: "ok", journalposter: [journalpost] }));
      const varsleOpprettet = renderMedHandlinger();
      åpneOversikt();
      await screen.findByText("Svarbrev om kontoopplysninger");
      vi.useFakeTimers();
      await varsleOpprettet(opprettet);

      mockFetch.mockReturnValueOnce(svar({ status: "feil", årsak: "utilgjengelig" }, 503));
      await ventPå(SYNK_FORSINKELSER_MS[0]);
      expect(screen.getByText("Svarbrev om kontoopplysninger")).toBeDefined();
      expect(within(radFor("Varsel om kontroll")).getByText("Venter på Gosys")).toBeDefined();

      mockFetch.mockReturnValueOnce(svar({ status: "ok", journalposter: [journalpost] }));
      await ventPå(SYNK_FORSINKELSER_MS[1]);
      expect(within(radFor("Varsel om kontroll")).getByText("Venter på Gosys")).toBeDefined();

      mockFetch.mockReturnValueOnce(svar({ status: "ok", journalposter: [iGosys, journalpost] }));
      await ventPå(SYNK_FORSINKELSER_MS[2]);
      expect(mockFetch).toHaveBeenCalledTimes(4);
      expect(screen.queryByText("Venter på Gosys")).toBeNull();
    });

    it("åpner oversikten og viser journalposten når oversikten var lukket", async () => {
      mockFetch.mockReturnValue(svar({ status: "ok", journalposter: [] }));
      const varsleOpprettet = renderMedHandlinger();

      await varsleOpprettet(opprettet);

      expect(await screen.findByText("Varsel om kontroll")).toBeDefined();
      expect(screen.getByRole("button", { name: "Lukk dokumentoversikt" })).toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("henter likevel på nytt når journalpost-IDen mangler", async () => {
      mockFetch.mockReturnValue(svar({ status: "ok", journalposter: [] }));
      const varsleOpprettet = renderMedHandlinger();
      åpneOversikt();
      await screen.findByText("Ingen journalføringer å vise for denne saken.");
      vi.useFakeTimers();

      await varsleOpprettet({ ...opprettet, journalpostId: null });
      await ventPå(SYNK_FORSINKELSER_MS[0]);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("tilbyr manuell oppdatering når de automatiske forsøkene er brukt opp", async () => {
      mockFetch.mockReturnValue(svar({ status: "ok", journalposter: [] }));
      const varsleOpprettet = renderMedHandlinger();
      åpneOversikt();
      await screen.findByText("Ingen journalføringer å vise for denne saken.");
      vi.useFakeTimers();
      await varsleOpprettet(opprettet);

      for (const forsinkelse of SYNK_FORSINKELSER_MS) {
        expect(screen.queryByRole("button", { name: "Oppdater" })).toBeNull();
        await ventPå(forsinkelse);
      }
      expect(mockFetch).toHaveBeenCalledTimes(1 + SYNK_FORSINKELSER_MS.length);

      mockFetch.mockReturnValueOnce(svar({ status: "ok", journalposter: [iGosys] }));
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Oppdater" }));
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(within(radFor("Varsel om kontroll")).getByText("Journalført")).toBeDefined();
      expect(screen.queryByRole("button", { name: "Oppdater" })).toBeNull();
    });

    it("viser journalposten selv om oversikten ikke er hentet ennå og hentingen feiler", async () => {
      mockFetch.mockReturnValue(svar({ status: "feil", årsak: "utilgjengelig" }, 503));
      const varsleOpprettet = renderMedHandlinger();

      await varsleOpprettet(opprettet);

      expect(
        await screen.findByText("Kunne ikke hente dokumentoversikten fra Gosys. Prøv igjen."),
      ).toBeDefined();
      expect(within(radFor("Varsel om kontroll")).getByText("Venter på Gosys")).toBeDefined();
    });

    it("synkroniserer ikke videre når panelet fjernes mens en henting pågår", async () => {
      mockFetch.mockReturnValueOnce(svar({ status: "ok", journalposter: [] }));
      let fullfør: (respons: Response) => void = () => {};
      const varsleOpprettet = renderMedHandlinger();
      åpneOversikt();
      await screen.findByText("Ingen journalføringer å vise for denne saken.");
      vi.useFakeTimers();
      await varsleOpprettet(opprettet);

      mockFetch.mockReturnValueOnce(new Promise<Response>((resolve) => (fullfør = resolve)));
      await ventPå(SYNK_FORSINKELSER_MS[0]);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      cleanup();
      await act(async () => {
        fullfør(Response.json({ status: "ok", journalposter: [] }));
        await vi.advanceTimersByTimeAsync(60_000);
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
