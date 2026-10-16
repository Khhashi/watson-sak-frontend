import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GosysDokumentpanel } from "./GosysDokumentpanel";
import type { ArkivJournalpost } from "./typer";

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
    const rad = screen.getByText("Svarbrev om kontoopplysninger").closest("tr")!;
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

  it("henter på nytt når en journalpost er opprettet", async () => {
    mockFetch.mockReturnValue(svar({ status: "ok", journalposter: [] }));
    let varsleOpprettet = () => {};
    renderPanel({
      renderHandlinger: ({ onJournalpostOpprettet }) => {
        varsleOpprettet = onJournalpostOpprettet;
        return null;
      },
    });
    åpneOversikt();
    await screen.findByText("Ingen journalføringer å vise for denne saken.");

    varsleOpprettet();

    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
  });
});
