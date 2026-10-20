import { JOURNALFØRBARE_CONTENT_TYPES } from "~/saker/filer/fil-type-utils";
import type { DokumentNode, FilResponse } from "~/saker/filer/typer";

/** Kombinert grense for antall filer og dokumenter som kan arkiveres i én journalpost. */
export const MAKS_ANTALL_VALGTE = 10;

/** En fil eller et Watson Sak-dokument som kan arkiveres. */
export type ArkivElement = {
  nøkkel: string;
  type: "fil" | "dokument";
  id: string;
  navn: string;
};

export type ArkivMappe = {
  sti: string;
  navn: string;
  undermapper: ArkivMappe[];
  elementer: ArkivElement[];
};

/** Rotnivået i treet. Elementer uten mappe ligger direkte her. */
export type ArkivTre = {
  undermapper: ArkivMappe[];
  elementer: ArkivElement[];
};

export type Avkrysning = "valgt" | "delvis" | "ikke-valgt";

const sammenlignNavn = new Intl.Collator("nb", { numeric: true }).compare;

/**
 * Bygger mappetreet med filer og dokumenter som kan arkiveres.
 * Filer som ikke kan journalføres og elementer som allerede er arkivert, er utelatt.
 * Mapper uten valgbare elementer finnes derfor ikke i treet.
 */
export function byggArkivTre(filer: FilResponse[], dokumenter: DokumentNode[]): ArkivTre {
  const rot: ArkivTre = { undermapper: [], elementer: [] };

  for (const fil of filer) {
    if (fil.arkivert || !JOURNALFØRBARE_CONTENT_TYPES.includes(fil.contentType)) continue;
    finnEllerLagMappe(rot, fil.mappe).elementer.push({
      nøkkel: `fil:${fil.id}`,
      type: "fil",
      id: fil.id,
      navn: fil.filnavn,
    });
  }
  for (const dokument of dokumenter) {
    if (dokument.arkivert) continue;
    finnEllerLagMappe(rot, dokument.mappe).elementer.push({
      nøkkel: `dokument:${dokument.id}`,
      type: "dokument",
      id: dokument.id,
      navn: dokument.tittel,
    });
  }

  sorter(rot);
  return rot;
}

function finnEllerLagMappe(rot: ArkivTre, sti: string | null | undefined): ArkivTre {
  const deler = (sti ?? "").split("/").filter(Boolean);
  let gjeldende: ArkivTre = rot;
  deler.forEach((navn, indeks) => {
    const mappeSti = deler.slice(0, indeks + 1).join("/");
    let neste = gjeldende.undermapper.find((mappe) => mappe.sti === mappeSti);
    if (!neste) {
      neste = { sti: mappeSti, navn, undermapper: [], elementer: [] };
      gjeldende.undermapper.push(neste);
    }
    gjeldende = neste;
  });
  return gjeldende;
}

function sorter(node: ArkivTre) {
  node.undermapper.sort((a, b) => sammenlignNavn(a.navn, b.navn));
  node.elementer.sort((a, b) => sammenlignNavn(a.navn, b.navn));
  node.undermapper.forEach(sorter);
}

/** Alle elementer i treet, i samme rekkefølge som de vises. */
export function alleElementer(node: ArkivTre): ArkivElement[] {
  return [...node.undermapper.flatMap(alleElementer), ...node.elementer];
}

export function mappeAvkrysning(mappe: ArkivMappe, valgte: readonly string[]): Avkrysning {
  const nøkler = alleElementer(mappe).map((element) => element.nøkkel);
  const antallValgt = nøkler.filter((nøkkel) => valgte.includes(nøkkel)).length;
  if (antallValgt === 0) return "ikke-valgt";
  return antallValgt === nøkler.length ? "valgt" : "delvis";
}

/**
 * Krysser av eller fjerner avkrysning for alle elementer i mappen.
 * Ved avkrysning legges elementer til i visningsrekkefølge til grensen er nådd.
 * Er mappen helt valgt, eller delvis valgt uten plass til flere, fjernes valget.
 */
export function veksleMappe(
  mappe: ArkivMappe,
  valgte: readonly string[],
  maks = MAKS_ANTALL_VALGTE,
): string[] {
  const nøkler = alleElementer(mappe).map((element) => element.nøkkel);
  const avkrysning = mappeAvkrysning(mappe, valgte);
  const ledige = Math.max(maks - valgte.length, 0);

  if (avkrysning === "valgt" || (avkrysning === "delvis" && ledige === 0)) {
    return valgte.filter((nøkkel) => !nøkler.includes(nøkkel));
  }

  const nye = nøkler.filter((nøkkel) => !valgte.includes(nøkkel)).slice(0, ledige);
  return [...valgte, ...nye];
}

/** En mappe kan ikke krysses av når ingenting i den er valgt og grensen er nådd. */
export function kanVelgeMappe(
  mappe: ArkivMappe,
  valgte: readonly string[],
  maks = MAKS_ANTALL_VALGTE,
): boolean {
  return mappeAvkrysning(mappe, valgte) !== "ikke-valgt" || valgte.length < maks;
}
