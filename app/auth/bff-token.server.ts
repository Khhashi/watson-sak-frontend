import { data } from "react-router";
import { getBackendOboToken } from "~/auth/access-token";

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
