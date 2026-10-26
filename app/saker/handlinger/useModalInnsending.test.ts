import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useModalInnsending } from "./useModalInnsending";

type Fetcher = Parameters<typeof useModalInnsending>[0];

describe("useModalInnsending", () => {
  it("lukker ved suksess", () => {
    const onSuksess = vi.fn();
    const { result, rerender } = renderHook(
      ({ fetcher }) => useModalInnsending(fetcher, onSuksess),
      {
        initialProps: { fetcher: { state: "idle" } as Fetcher },
      },
    );

    act(() => result.current.markerSendt());
    rerender({ fetcher: { state: "idle", data: { ok: true } } });

    expect(onSuksess).toHaveBeenCalledOnce();
  });

  it("holder modalen åpen og viser meldingen ved avvist handling", () => {
    const onSuksess = vi.fn();
    const { result, rerender } = renderHook(
      ({ fetcher }) => useModalInnsending(fetcher, onSuksess),
      {
        initialProps: { fetcher: { state: "idle" } as Fetcher },
      },
    );

    act(() => result.current.markerSendt());
    rerender({ fetcher: { state: "idle", data: { ok: false, feil: "Saken er avsluttet" } } });

    expect(onSuksess).not.toHaveBeenCalled();
    expect(result.current.feilmelding).toBe("Saken er avsluttet");
  });
});
