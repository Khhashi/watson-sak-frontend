import { describe, expect, it } from "vitest";
import type { DokumentNode, FilResponse } from "~/saker/filer/typer";
import { byggArkivTre, kanVelgeMappe, mappeAvkrysning, veksleMappe } from "./arkivvalg";

function fil(id: string, filnavn: string, overstyr: Partial<FilResponse> = {}): FilResponse {
  return {
    id,
    filnavn,
    storrelse: 100,
    contentType: "application/pdf",
    opprettetAv: "Z999999",
    opprettet: "2026-01-01T10:00:00",
    bruktIDokumenter: [],
    ...overstyr,
  };
}

function dokument(id: string, tittel: string, overstyr: Partial<DokumentNode> = {}): DokumentNode {
  return {
    id,
    tittel,
    opprettetAv: "Z999999",
    opprettetDato: "2026-01-01T10:00:00",
    endretAv: "Z999999",
    endretDato: "2026-01-01T10:00:00",
    låsAv: null,
    ...overstyr,
  };
}

describe("byggArkivTre", () => {
  it("bygger nestede mapper og legger elementer uten mappe på rotnivå", () => {
    const tre = byggArkivTre(
      [fil("f1", "kontoutskrift.pdf", { mappe: "Bank/Kontoutskrifter" }), fil("f2", "rot.pdf")],
      [dokument("d1", "Notat", { mappe: "Bank" })],
    );

    expect(tre.elementer.map((e) => e.navn)).toEqual(["rot.pdf"]);
    expect(tre.undermapper).toHaveLength(1);
    const bank = tre.undermapper[0];
    expect(bank).toMatchObject({ sti: "Bank", navn: "Bank" });
    expect(bank.elementer.map((e) => e.nøkkel)).toEqual(["dokument:d1"]);
    expect(bank.undermapper[0]).toMatchObject({
      sti: "Bank/Kontoutskrifter",
      navn: "Kontoutskrifter",
    });
    expect(bank.undermapper[0].elementer.map((e) => e.nøkkel)).toEqual(["fil:f1"]);
  });

  it("utelater arkiverte elementer, filer som ikke kan journalføres og tomme mapper", () => {
    const tre = byggArkivTre(
      [
        fil("f1", "bilde.png", { contentType: "image/png", mappe: "Bilder" }),
        fil("f2", "arkivert.pdf", { arkivert: "2026-01-02T10:00:00", mappe: "Arkiv" }),
      ],
      [dokument("d1", "Arkivert notat", { arkivert: "2026-01-02T10:00:00" })],
    );

    expect(tre).toEqual({ undermapper: [], elementer: [] });
  });

  it("tar med Word-filer, siden backend gjør dem om til PDF", () => {
    const tre = byggArkivTre(
      [
        fil("f1", "notat.docx", {
          contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }),
      ],
      [],
    );

    expect(tre.elementer.map((e) => e.nøkkel)).toEqual(["fil:f1"]);
  });
});

describe("mappevalg", () => {
  const tre = byggArkivTre(
    [fil("a", "a.pdf", { mappe: "M" }), fil("b", "b.pdf", { mappe: "M/Under" })],
    [dokument("c", "c", { mappe: "M" })],
  );
  const mappe = tre.undermapper[0];

  it("viser tre tilstander basert på valgte elementer i mappen og undermappene", () => {
    expect(mappeAvkrysning(mappe, [])).toBe("ikke-valgt");
    expect(mappeAvkrysning(mappe, ["fil:b"])).toBe("delvis");
    expect(mappeAvkrysning(mappe, ["fil:a", "fil:b", "dokument:c"])).toBe("valgt");
  });

  it("velger alle elementer i mappen og fjerner dem ved nytt klikk", () => {
    const valgt = veksleMappe(mappe, ["fil:annen"]);
    expect(valgt).toEqual(["fil:annen", "fil:b", "fil:a", "dokument:c"]);
    expect(veksleMappe(mappe, valgt)).toEqual(["fil:annen"]);
  });

  it("fyller opp til grensen når det ikke er plass til alle", () => {
    expect(veksleMappe(mappe, ["x"], 3)).toEqual(["x", "fil:b", "fil:a"]);
  });

  it("fjerner valget når mappen er delvis valgt og grensen er nådd", () => {
    expect(veksleMappe(mappe, ["x", "fil:b"], 2)).toEqual(["x"]);
  });

  it("kan ikke velge en mappe uten valgte elementer når grensen er nådd", () => {
    expect(kanVelgeMappe(mappe, ["x", "y"], 2)).toBe(false);
    expect(kanVelgeMappe(mappe, ["x", "fil:a"], 2)).toBe(true);
  });
});
