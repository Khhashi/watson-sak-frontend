import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  class BackendFeilException extends Error {
    constructor(
      public readonly status: number,
      message: string,
    ) {
      super(message);
    }
  }
  return { BackendFeilException, hentMapper: vi.fn() };
});

vi.mock("~/saker/api.server", () => ({
  BackendFeilException: mocks.BackendFeilException,
  hentMapper: mocks.hentMapper,
}));

const { hentMapperstier } = await import("./mapper.server");

describe("hentMapperstier", () => {
  it("returnerer stiene fra backend", async () => {
    mocks.hentMapper.mockResolvedValueOnce([{ sti: "Bank" }, { sti: "Bank/Utskrifter" }]);
    expect(await hentMapperstier("token", "1")).toEqual(["Bank", "Bank/Utskrifter"]);
  });

  // 404 betyr at brukeren mangler tilgang til personen. Backend skjuler da at saken finnes.
  it.each([403, 404])("gir tom liste når brukeren mangler tilgang (%i)", async (status) => {
    mocks.hentMapper.mockRejectedValueOnce(new mocks.BackendFeilException(status, "Ingen tilgang"));
    expect(await hentMapperstier("token", "1")).toEqual([]);
  });

  it.each([500])("kaster videre ved %i", async (status) => {
    mocks.hentMapper.mockRejectedValueOnce(new mocks.BackendFeilException(status, "Feil"));
    await expect(hentMapperstier("token", "1")).rejects.toThrow("Feil");
  });
});
