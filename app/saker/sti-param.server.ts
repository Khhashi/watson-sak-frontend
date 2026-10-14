import { data } from "react-router";
import { logger } from "~/logging/logging";

/**
 * Validering og koding av ID-er som settes inn i backend-URL-er (TH-38).
 *
 * Ugyldige ID-er gir samme 404 som en sak eller et dokument som ikke finnes,
 * slik at svaret ikke avslører noe om forventet format. Vi logger bare navnet
 * på parameteren, aldri verdien.
 */

const SAK_ID = /^[1-9][0-9]{0,18}$/;
const LONG_MAX = 9223372036854775807n;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ikkeFunnet(navn: string): never {
  logger.info("Ugyldig sti-parameter", { param: navn });
  throw data("Fant ikke siden", { status: 404 });
}

/**
 * Sak-ID-er er `Long` i backend: positivt heltall, maks `Long.MAX_VALUE`.
 * Tar bare inn tekst: et JS-`number` over 2^53 har allerede mistet presisjon.
 */
export function parseSakId(verdi: string | undefined | null, navn = "sakId"): string {
  if (typeof verdi !== "string" || !SAK_ID.test(verdi) || BigInt(verdi) > LONG_MAX) {
    return ikkeFunnet(navn);
  }
  return verdi;
}

/** UUID på kanonisk form (8-4-4-4-12), normalisert til små bokstaver. */
export function parseUuid(verdi: string | undefined | null, navn: string): string {
  if (typeof verdi !== "string" || !UUID.test(verdi)) {
    return ikkeFunnet(navn);
  }
  return verdi.toLowerCase();
}

/**
 * Bygger en backend-sti der hver innsatt verdi kodes med `encodeURIComponent`.
 * Tomme verdier, `.` og `..` avvises, siden `encodeURIComponent` lar punktum stå.
 * Ta bare inn råverdier. Query-strenger legges til med `URLSearchParams`.
 */
export function sti(deler: TemplateStringsArray, ...verdier: Array<string | number>): string {
  return deler.reduce((resultat, del, i) => {
    if (i === 0) return del;
    const verdi = verdier[i - 1];
    if (typeof verdi !== "string" && typeof verdi !== "number") {
      throw new Error("Ugyldig verdi i backend-sti");
    }
    const tekst = String(verdi);
    if (tekst === "" || tekst === "." || tekst === "..") {
      throw new Error("Ugyldig verdi i backend-sti");
    }
    return resultat + encodeURIComponent(tekst) + del;
  }, "");
}
