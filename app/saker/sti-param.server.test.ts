import { describe, expect, it, vi } from "vitest";
import { parseSakId, parseUuid, sti } from "./sti-param.server";

vi.mock("~/logging/logging", () => ({ logger: { info: vi.fn() } }));

async function statusVed(fn: () => unknown): Promise<number | undefined> {
  try {
    fn();
    return undefined;
  } catch (feil) {
    return (feil as { init?: { status?: number } }).init?.status;
  }
}

describe("parseSakId", () => {
  it.each(["1", "10000", "9223372036854775807"])("godtar %s", (verdi) => {
    expect(parseSakId(verdi)).toBe(verdi);
  });

  it("godtar tall", () => {
    expect(parseSakId(42)).toBe("42");
  });

  it.each([
    "",
    "0",
    "-1",
    "01",
    "..",
    ".",
    "../1",
    "1/../2",
    "%2e%2e",
    "1%2F2",
    "1 ",
    "1e3",
    "１２",
    "9223372036854775808",
    "99999999999999999999",
    undefined,
    null,
  ])("gir 404 for %j", async (verdi) => {
    expect(await statusVed(() => parseSakId(verdi))).toBe(404);
  });
});

describe("parseUuid", () => {
  const gyldig = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

  it("godtar og normaliserer til små bokstaver", () => {
    expect(parseUuid(gyldig.toUpperCase(), "docId")).toBe(gyldig);
  });

  it.each([
    "",
    "..",
    "3f2504e04f8941d39a0c0305e82c3301",
    `${gyldig}/..`,
    `../${gyldig}`,
    `${gyldig}x`,
    "%2e%2e",
    "%252e%252e",
    "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz",
    undefined,
  ])("gir 404 for %j", async (verdi) => {
    expect(await statusVed(() => parseUuid(verdi, "docId"))).toBe(404);
  });
});

describe("sti", () => {
  it("koder hver innsatt verdi", () => {
    expect(sti`/api/v1/kontrollsaker/${"a/b?c#d"}/dokumenter/${"%2e"}`).toBe(
      "/api/v1/kontrollsaker/a%2Fb%3Fc%23d/dokumenter/%252e",
    );
  });

  it("godtar tall", () => {
    expect(sti`/api/v1/kontrollsaker/${42}`).toBe("/api/v1/kontrollsaker/42");
  });

  it.each(["", ".", ".."])("avviser %j", (verdi) => {
    expect(() => sti`/api/v1/kontrollsaker/${verdi}`).toThrow();
  });

  it("avviser verdier som ikke er tekst eller tall", () => {
    expect(() => sti`/x/${undefined as unknown as string}`).toThrow();
  });
});
