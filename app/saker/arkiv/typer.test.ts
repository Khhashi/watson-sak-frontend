import { describe, expect, it } from "vitest";
import { arkivJournalposterSchema } from "./typer";

describe("arkivJournalposterSchema", () => {
  it("godtar svar med manglende valgfrie felter og ukjente koder", () => {
    const resultat = arkivJournalposterSchema.parse([
      {
        journalpostId: "1",
        datoOpprettet: "2026-10-12T10:00:00",
        journalposttype: "X",
        journalstatus: "HELT_NY",
        dokumenter: [{ dokumentInfoId: "d1" }],
      },
    ]);

    expect(resultat[0]).toMatchObject({
      journalposttype: "X",
      journalstatus: "HELT_NY",
      tittel: null,
      avsenderMottaker: null,
      dokumenter: [{ dokumentInfoId: "d1", tittel: null }],
    });
  });

  it("avviser journalposter uten id", () => {
    expect(
      arkivJournalposterSchema.safeParse([{ datoOpprettet: "2026-10-12T10:00:00" }]).success,
    ).toBe(false);
  });
});
