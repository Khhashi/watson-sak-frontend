import { data, type LoaderFunctionArgs } from "react-router";
import { getBackendOboToken } from "~/auth/access-token";
import { erUtloggetFeil } from "~/auth/session-utløpt.server";
import { skalBrukeMockdata } from "~/config/env.server";
import { logger } from "~/logging/logging";
import { hentSakstilgangFraMock } from "~/saker/tilgang.server";
import { parseSakId } from "~/saker/sti-param.server";
import { hentArkivJournalposter } from "./api.server";
import { hentMockArkivJournalposter } from "./mock-data.server";
import type { ArkivJournalposterResultat } from "./typer";

function lesStatus(feil: unknown): number | undefined {
  if (typeof feil !== "object" || feil === null) return undefined;
  return (
    (feil as { status?: number }).status ?? (feil as { init?: { status?: number } }).init?.status
  );
}

/**
 * BFF for journalposter i Gosys på én sak. Klienten henter denne med `fetch` når
 * dokumentoversikten åpnes, så sakssiden ikke venter på SAF.
 *
 * Forventede feil (429, 503, ugyldig svar) returneres som typede resultater i stedet
 * for å kastes, slik at en feil i Gosys bare påvirker panelet og ikke hele siden.
 * Utløpt sesjon (401) kastes videre.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  const sakId = parseSakId(params.sakId);

  if (skalBrukeMockdata) {
    const tilgang = await hentSakstilgangFraMock(request, sakId);
    if (!tilgang) {
      throw data("Sak ikke funnet", { status: 404 });
    }
    return {
      status: "ok",
      journalposter: tilgang.kanSe ? hentMockArkivJournalposter() : [],
    } satisfies ArkivJournalposterResultat;
  }

  const token = await getBackendOboToken(request);
  try {
    const journalposter = await hentArkivJournalposter(token, sakId);
    return { status: "ok", journalposter } satisfies ArkivJournalposterResultat;
  } catch (feil) {
    if (erUtloggetFeil(feil)) throw feil;
    const status = lesStatus(feil);
    if (status === 429) {
      return data(
        { status: "feil", årsak: "for-mange-forespørsler" } satisfies ArkivJournalposterResultat,
        { status: 429 },
      );
    }
    if (status === undefined) {
      logger.error("Uventet feil ved henting av journalposter fra Gosys");
    }
    return data({ status: "feil", årsak: "utilgjengelig" } satisfies ArkivJournalposterResultat, {
      status: 503,
    });
  }
}
