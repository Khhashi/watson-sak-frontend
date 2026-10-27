import { data } from "react-router";
import { skalBrukeMockdata } from "~/config/env.server";
import { logger } from "~/logging/logging";
import * as backendApi from "~/saker/api.server";
import { hentTekstfelt } from "~/utils/form-data";
import type { Route } from "./+types/SakDetaljSide.route";
import { backendAction } from "~/saker/handlinger/backend-action.server";
import { mockAction } from "~/saker/handlinger/mock-action.server";
import { parseSakId } from "~/saker/sti-param.server";
import { erTildelingshandling } from "~/saker/SakDetaljSide.felles.server";

// --- Action ---

export async function action({ request, params }: Route.ActionArgs) {
  const sakId = parseSakId(params.sakId);
  const formData = await request.formData();
  const handling = hentTekstfelt(formData, "handling", "Ugyldig handling");

  const utfør = () =>
    skalBrukeMockdata
      ? mockAction(request, sakId, handling, formData)
      : backendAction(request, sakId, handling, formData);

  if (!saksflythandlinger.has(handling)) {
    try {
      return await utfør();
    } catch (feil) {
      if (feil instanceof backendApi.BackendFeilException && feil.status === 409) {
        return konfliktfeil(feil, handling);
      }
      if (erTildelingshandling(handling) && erTilgangsfeil(feil)) {
        return data<SaksflytFeil>({ ok: false, feil: tilgangsfeilmelding(feil) }, { status: 403 });
      }
      throw feil;
    }
  }
  try {
    return await utfør();
  } catch (feil) {
    return saksflytfeil(feil);
  }
}

const skjemahandlinger = new Set(["rediger_saksinformasjon", "koble_sak", "fjern_kobling"]);

const standardTilgangsfeil = "Du har ikke tilgang til å gjøre denne endringen på saken.";

/** 403 fra backend eller fra tilgangssjekken i action. Vises i skjemaet i stedet for en feilside. */
function erTilgangsfeil(feil: unknown): boolean {
  if (feil instanceof backendApi.BackendFeilException) return feil.status === 403;
  return (
    !!feil &&
    typeof feil === "object" &&
    "init" in feil &&
    (feil.init as ResponseInit | null)?.status === 403
  );
}

function tilgangsfeilmelding(feil: unknown): string {
  // Backend svarer bare «Tilgang avvist», så vi bruker en egen tekst for den.
  if (
    !(feil instanceof backendApi.BackendFeilException) &&
    feil &&
    typeof feil === "object" &&
    "data" in feil &&
    typeof feil.data === "string"
  ) {
    return feil.data;
  }
  return standardTilgangsfeil;
}

/** 409 er en avvist regel, ikke en serverfeil. Meldingen fra backend sier hva som er galt. */
function konfliktfeil(feil: backendApi.BackendFeilException, handling: string) {
  // Saksinformasjonsskjemaet leser feil som et kart fra felt til meldinger.
  if (skjemahandlinger.has(handling)) {
    return data({ ok: false, feil: { skjema: [feil.message] } }, { status: 409 });
  }
  return data<SaksflytFeil>({ ok: false, feil: feil.message }, { status: 409 });
}

/** Handlingene fra saksflyt-modalen. Feil returneres slik at modalen beholder verdiene. */
const saksflythandlinger = new Set(["endre_steg_dialog", "lagre_resultat", "endre_status"]);

type SaksflytFeil = { ok: false; feil: string };

function saksflytfeil(feil: unknown) {
  if (feil instanceof Response) throw feil;
  if (feil instanceof backendApi.BackendFeilException) {
    if (feil.status === 409) return konfliktfeil(feil, "");
    return data<SaksflytFeil>(
      { ok: false, feil: "Kunne ikke lagre endringen. Last inn siden på nytt og prøv igjen." },
      { status: feil.status },
    );
  }
  if (
    feil &&
    typeof feil === "object" &&
    "init" in feil &&
    "data" in feil &&
    typeof feil.data === "string"
  ) {
    const status = (feil.init as ResponseInit | null)?.status ?? 400;
    return data<SaksflytFeil>({ ok: false, feil: feil.data }, { status });
  }
  // fetch avviser med TypeError ved nettverks- og DNS-feil, før backend har svart.
  if (feil instanceof TypeError) {
    logger.error("Fikk ikke kontakt med backend fra saksflyt-modalen", { feil: feil.message });
    return data<SaksflytFeil>(
      { ok: false, feil: "Fikk ikke kontakt med baksystemet. Prøv igjen om litt." },
      { status: 502 },
    );
  }
  throw feil;
}
