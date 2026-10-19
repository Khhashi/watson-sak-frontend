import { describe, expect, it } from "vitest";
import { oppdaterValgteMerkinger } from "./merking-utils";

const merker = ["A-krim Agder"];

describe("oppdaterValgteMerkinger", () => {
  it("bruker katalogverdien nøyaktig ved treff uavhengig av casing og whitespace", () => {
    expect(oppdaterValgteMerkinger([], "  a-KRIM   agder  ", true, merker)).toEqual([
      "A-krim Agder",
    ]);
  });

  it("finner katalogverdier ved NFC- og NFD-varianter", () => {
    const nfcMerke = "Café Agder";
    const nfdMerke = "Cafe\u0301 Agder";

    expect(oppdaterValgteMerkinger([], nfdMerke, true, [nfcMerke])).toEqual([nfcMerke]);
  });

  it("normaliserer en ny merking til NFC, enkel whitespace, lowercase og stor førstebokstav", () => {
    expect(oppdaterValgteMerkinger([], "  E\u0301GEN   MERKING  ", true, [])).toEqual([
      "Égen merking",
    ]);
  });

  it("bevarer dagens ett-tegns storbokstavformatering for bokstaver med fler-tegns uppercase", () => {
    expect(oppdaterValgteMerkinger([], " ßETA ", true, [])).toEqual(["ßeta"]);
  });

  it("unngår duplikater etter normalisering og fjerner alle ekvivalente valg", () => {
    expect(
      oppdaterValgteMerkinger(["A-krim Agder", "a-KRIM   AGDER"], "a-krim agder", true, merker),
    ).toEqual(["A-krim Agder"]);

    expect(
      oppdaterValgteMerkinger(["A-krim Agder", "a-KRIM   AGDER"], "A-krim agder", false, merker),
    ).toEqual([]);
  });
});
