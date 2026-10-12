import { data } from "react-router";
import type { KontrollsakResponse } from "~/saker/types.backend";

const ALDERSVARSEL_VERDIER = ["NAERMER_SEG_12_MAANEDER", "FRA_30_DAGER"] as const;
export type Aldersvarsel = (typeof ALDERSVARSEL_VERDIER)[number];

export const ALDERSVARSEL_VALG: { verdi: Aldersvarsel; etikett: string }[] = [
  { verdi: "NAERMER_SEG_12_MAANEDER", etikett: "Nærmer seg 12 måneder" },
  { verdi: "FRA_30_DAGER", etikett: "Fra 30 dager" },
];

/** Verdien for `ansvarlig` som betyr innlogget saksbehandler. Backend utleder identen fra tokenet. */
export const ANSVARLIG_MEG = "MEG";

function erAldersvarsel(verdi: string): verdi is Aldersvarsel {
  return (ALDERSVARSEL_VERDIER as readonly string[]).includes(verdi);
}

/**
 * Leser aldersfilter og «Meg»-filter fra URL-en. Ukjente verdier, flere verdier og «Meg» sammen
 * med valgt saksbehandler gir 400, så brukeren aldri ser et bredere utvalg enn lenken lovet.
 * Feilmeldingene gjentar ikke verdien, siden den kan være en ident.
 */
export function parseAlderOgAnsvarlig(searchParams: URLSearchParams): {
  aldersvarsel: Aldersvarsel | undefined;
  ansvarligMeg: boolean;
} {
  const aldersverdier = searchParams.getAll("aldersvarsel");
  const [aldersvarsel] = aldersverdier;
  if (aldersverdier.length > 1 || (aldersvarsel !== undefined && !erAldersvarsel(aldersvarsel))) {
    throw data("Ugyldig aldersfilter", { status: 400 });
  }
  const ansvarligverdier = searchParams.getAll("ansvarlig");
  if (
    ansvarligverdier.length > 1 ||
    (ansvarligverdier.length === 1 && ansvarligverdier[0] !== ANSVARLIG_MEG)
  ) {
    throw data("Ugyldig verdi for ansvarlig", { status: 400 });
  }
  const ansvarligMeg = ansvarligverdier.length === 1;
  if (ansvarligMeg && searchParams.get("saksbehandler")) {
    throw data("Kan ikke filtrere på både «Meg» og valgt saksbehandler", { status: 400 });
  }
  return { aldersvarsel: aldersvarsel as Aldersvarsel | undefined, ansvarligMeg };
}

type Dato = { år: number; måned: number; dag: number };

const osloDato = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Oslo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function tilOsloDato(tidspunkt: Date): Dato {
  const deler = Object.fromEntries(
    osloDato.formatToParts(tidspunkt).map((del) => [del.type, Number(del.value)]),
  );
  return { år: deler.year, måned: deler.month, dag: deler.day };
}

function dagerIMåned(år: number, måned: number): number {
  return new Date(Date.UTC(år, måned, 0)).getUTCDate();
}

/** Samme semantikk som Javas `LocalDate.minusMonths`: dagen kuttes til siste dag i måneden. */
function minusMåneder(dato: Dato, antall: number): Dato {
  const totalt = dato.år * 12 + (dato.måned - 1) - antall;
  const år = Math.floor(totalt / 12);
  const måned = (totalt % 12) + 1;
  return { år, måned, dag: Math.min(dato.dag, dagerIMåned(år, måned)) };
}

function minusDager(dato: Dato, antall: number): Dato {
  const d = new Date(Date.UTC(dato.år, dato.måned - 1, dato.dag - antall));
  return { år: d.getUTCFullYear(), måned: d.getUTCMonth() + 1, dag: d.getUTCDate() };
}

function sammenlign(a: Dato, b: Dato): number {
  return a.år - b.år || a.måned - b.måned || a.dag - b.dag;
}

/**
 * Speiler backendens `Opprettelsesintervall` for mockvisningen. Regnes på kalenderdatoer i
 * Europe/Oslo. Avsluttede saker er aldri med, uansett andre filtre.
 */
export function matcherAldersvarsel(
  sak: Pick<KontrollsakResponse, "opprettet" | "steg">,
  aldersvarsel: Aldersvarsel,
  nå: Date = new Date(),
): boolean {
  if (sak.steg === "AVSLUTTET") return false;
  const opprettet = tilOsloDato(new Date(sak.opprettet));
  const iDag = tilOsloDato(nå);
  switch (aldersvarsel) {
    case "FRA_30_DAGER":
      return sammenlign(opprettet, minusDager(iDag, 30)) <= 0;
    case "NAERMER_SEG_12_MAANEDER":
      return (
        sammenlign(opprettet, minusMåneder(iDag, 12)) > 0 &&
        sammenlign(opprettet, minusMåneder(iDag, 11)) <= 0
      );
  }
}
