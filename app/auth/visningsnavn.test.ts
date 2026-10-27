import { describe, expect, it } from "vitest";
import { visningsnavn, visningsnavnFraNavn } from "./visningsnavn";

describe("visningsnavn", () => {
  it.each([
    ["Z993376", "z993376", "Petter Øst"],
    ["Z990778", "z990778", "Kari Ledersen Øst"],
    ["Z993471", "z993471", "Wenche Vest"],
  ])(
    "overstyrer navnet til ident %s uavhengig av store/små bokstaver",
    (ident, litenIdent, visningsnavnForIdent) => {
      expect(visningsnavn(ident, "Ekte Navn")).toBe(visningsnavnForIdent);
      expect(visningsnavn(litenIdent, "Ekte Navn")).toBe(visningsnavnForIdent);
    },
  );

  it("beholder navnet til andre identer", () => {
    expect(visningsnavn("Z999999", "Saks Behandlersen")).toBe("Saks Behandlersen");
  });

  it("beholder navnet når identen mangler", () => {
    expect(visningsnavn(undefined, "Saks Behandlersen")).toBe("Saks Behandlersen");
    expect(visningsnavn(null, null)).toBeNull();
  });
});

describe("visningsnavnFraNavn", () => {
  it.each([
    ["Z993376", "Petter Øst"],
    ["Z990778", "Kari Ledersen Øst"],
    ["Z993471", "Wenche Vest"],
  ])(
    "overstyrer registrert Test/TEST-navn, ren ident og trimmet navn for %s",
    (ident, visningsnavnForIdent) => {
      expect(visningsnavnFraNavn(`Test ${ident}`)).toBe(visningsnavnForIdent);
      expect(visningsnavnFraNavn(`TEST ${ident}`)).toBe(visningsnavnForIdent);
      expect(visningsnavnFraNavn(ident)).toBe(visningsnavnForIdent);
      expect(visningsnavnFraNavn(`  Test ${ident}  `)).toBe(visningsnavnForIdent);
    },
  );

  it("beholder andre navn", () => {
    expect(visningsnavnFraNavn("Saks Behandlersen")).toBe("Saks Behandlersen");
    expect(visningsnavnFraNavn("SYSTEM")).toBe("SYSTEM");
    expect(visningsnavnFraNavn(null)).toBeNull();
  });
});
