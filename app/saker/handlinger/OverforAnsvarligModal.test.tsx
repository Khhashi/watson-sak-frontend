import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { KontrollsakSaksbehandler } from "~/saker/types.backend";
import { OverforAnsvarligModal } from "./OverforAnsvarligModal";

const { submitMock } = vi.hoisted(() => ({
  submitMock: vi.fn(),
}));

vi.mock("react-router", () => ({
  useFetcher: () => ({
    state: "idle",
    submit: submitMock,
    Form: "form",
  }),
}));

const saksbehandlere: KontrollsakSaksbehandler[] = [
  { navIdent: "Z111111", navn: "Nåværende Saksbehandler", enhet: "4812" },
  { navIdent: "Z222222", navn: "Ny Saksbehandler", enhet: "4813" },
];

describe("OverforAnsvarligModal", () => {
  it("fjerner valideringsfeilen når en saksbehandler velges", async () => {
    render(
      <OverforAnsvarligModal
        sakId="101"
        saksbehandlerDetaljer={saksbehandlere}
        åpen={true}
        onClose={vi.fn()}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Overfør sak" }));
    });

    expect(screen.getByText("Velg en saksbehandler")).toBeDefined();

    await act(async () => {
      fireEvent.change(screen.getByRole("combobox", { name: "Saksbehandler" }), {
        target: { value: "Ny Saksbehandler" },
      });
      fireEvent.pointerUp(screen.getByRole("option", { name: "Ny Saksbehandler (Z222222)" }));
    });

    expect(screen.queryByText("Velg en saksbehandler")).toBeNull();
  });
});
