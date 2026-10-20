import { data } from "react-router";
import { getBackendOboToken } from "~/auth/access-token";

/**
 * Kaster en route-feilrespons med statuskode 401 dersom backend-kallet
 * avviste forespørselen på grunn av manglende/utløpt autentisering, eller
 * statuskode 429 dersom backend har mottatt for mange forespørsler.
 *
 * Dette skiller en utlogget bruker (behandles av `RootErrorBoundary` med en
 * egen «logg inn på nytt»-side) fra uventede serverfeil, som ellers ville
 * gitt en generisk 500-side når brukeren blir logget ut mens siden er åpen.
 */
export function kastHvisUtlogget(respons: Response): void {
  if (respons.status === 401) {
    throw data("Sesjonen er utløpt. Logg inn på nytt.", { status: 401 });
  }
  if (respons.status === 429) {
    throw data("For mange forespørsler. Prøv igjen om et par minutter.", { status: 429 });
  }
}

/**
 * Sant når en fanget feil er en utløpt sesjon (401), enten som `Response`
 * eller som `data()`-feil. Brukes i `catch` der andre feil gjøres om til en
 * vennlig feilmelding, men 401 må bevares slik at innloggingssiden vises.
 */
export function erUtloggetFeil(feil: unknown): boolean {
  if (typeof feil !== "object" || feil === null) return false;
  const status =
    (feil as { status?: number }).status ?? (feil as { init?: { status?: number } }).init?.status;
  return status === 401;
}

/**
 * Henter OBO-token for backend i BFF-ruter som klienten kaller med `fetch`.
 * Tokenhjelperen kaster en redirect til innlogging når sesjonen er utløpt. Med
 * `fetch` gir en redirect HTML eller en CORS-feil, så vi gjør den om til 401.
 */
export async function hentTokenEllerKast401(request: Request): Promise<string> {
  try {
    return await getBackendOboToken(request);
  } catch (feil) {
    if (feil instanceof Response && feil.status >= 300 && feil.status < 400) {
      throw data("Sesjonen er utløpt. Logg inn på nytt.", { status: 401 });
    }
    throw feil;
  }
}
