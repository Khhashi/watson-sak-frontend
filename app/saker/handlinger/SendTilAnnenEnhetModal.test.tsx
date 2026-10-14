import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { KontrollsakSaksbehandler } from "~/saker/types.backend";
import { SendTilAnnenEnhetModal } from "./SendTilAnnenEnhetModal";

const { submitMock } = vi.hoisted(() => ({
  submitMock: vi.fn(),
}));

vi.mock("react-router", () => ({
  useFetcher: () => ({
    state: "idle",
    submit: submitMock,
    Form: "form",
  }),
  useNavigate: () => vi.fn(),
}));

vi.mock("~/kodeverk/useKodeverk", () => ({
  useKodeverk: () => ({
    enheter: [
      { kode: "4812", beskrivelse: "Nav Kontroll" },
      { kode: "4813", beskrivelse: "Nav Arbeid" },
    ],
  }),
}));

vi.mock("~/analytics/analytics", () => ({
  sporHendelse: vi.fn(),
}));

const saksbehandlere: KontrollsakSaksbehandler[] = [
  { navIdent: "Z111111", navn: "Nåværende Saksbehandler", enhet: "4812" },
  { navIdent: "Z222222", navn: "Ny Saksbehandler", enhet: "4813" },
];

describe("SendTilAnnenEnhetModal", () => {
  beforeEach(() => {
    submitMock.mockClear();
  });

  it("beholder valgt ny ansvarlig gjennom bekreftelse og innsending", async () => {
    render(
      <SendTilAnnenEnhetModal
        sakId="101"
        steg="UTREDNING"
        nåværendeEnhet="4812"
        ansvarligSaksbehandler={saksbehandlere[0]}
        saksbehandlerDetaljer={saksbehandlere}
        innloggetNavIdent="Z111111"
        åpen={true}
        onClose={vi.fn()}
      />,
    );

    await act(async () => {});

    await act(async () => {
      fireEvent.change(screen.getByRole("combobox", { name: "Ny enhet" }), {
        target: { value: "4813" },
      });
      fireEvent.change(screen.getByRole("combobox", { name: "Ny ansvarlig saksbehandler" }), {
        target: { value: "Ny Saksbehandler" },
      });
      fireEvent.pointerUp(screen.getByRole("option", { name: "Ny Saksbehandler (Z222222)" }));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Fortsett" }));
    });

    expect(screen.getByText("Ny Saksbehandler (Z222222)")).toBeDefined();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Send til annen enhet" }));
    });

    expect(submitMock).toHaveBeenCalledOnce();
    const [formData] = submitMock.mock.calls[0];
    expect(formData.get("seksjon")).toBe("4813");
    expect(formData.get("ansvarligNavIdent")).toBe("Z222222");
  });

  it("fjerner valideringsfeilen når en ny ansvarlig velges", async () => {
    render(
      <SendTilAnnenEnhetModal
        sakId="101"
        steg="UTREDNING"
        nåværendeEnhet="4812"
        ansvarligSaksbehandler={saksbehandlere[0]}
        saksbehandlerDetaljer={saksbehandlere}
        innloggetNavIdent="Z111111"
        åpen={true}
        onClose={vi.fn()}
      />,
    );

    await act(async () => {
      fireEvent.change(screen.getByRole("combobox", { name: "Ny enhet" }), {
        target: { value: "4813" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Fortsett" }));
    });

    expect(screen.getByText("Velg en ny ansvarlig saksbehandler")).toBeDefined();

    await act(async () => {
      fireEvent.change(screen.getByRole("combobox", { name: "Ny ansvarlig saksbehandler" }), {
        target: { value: "Ny Saksbehandler" },
      });
      fireEvent.pointerUp(screen.getByRole("option", { name: "Ny Saksbehandler (Z222222)" }));
    });

    expect(screen.queryByText("Velg en ny ansvarlig saksbehandler")).toBeNull();
  });

  it("beholder valgt ny ansvarlig når brukeren går tilbake fra bekreftelsen", async () => {
    render(
      <SendTilAnnenEnhetModal
        sakId="101"
        steg="UTREDNING"
        nåværendeEnhet="4812"
        ansvarligSaksbehandler={saksbehandlere[0]}
        saksbehandlerDetaljer={saksbehandlere}
        innloggetNavIdent="Z111111"
        åpen={true}
        onClose={vi.fn()}
      />,
    );

    await act(async () => {
      fireEvent.change(screen.getByRole("combobox", { name: "Ny enhet" }), {
        target: { value: "4813" },
      });
      fireEvent.change(screen.getByRole("combobox", { name: "Ny ansvarlig saksbehandler" }), {
        target: { value: "Ny Saksbehandler" },
      });
      fireEvent.pointerUp(screen.getByRole("option", { name: "Ny Saksbehandler (Z222222)" }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Fortsett" }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Avbryt" }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Fortsett" }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Send til annen enhet" }));
    });

    const [formData] = submitMock.mock.calls[0];
    expect(formData.get("ansvarligNavIdent")).toBe("Z222222");
  });
});
