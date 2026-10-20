import { data, type LoaderFunctionArgs } from "react-router";
import { hentTokenEllerKast401 } from "~/auth/bff-token.server";
import { erUtloggetFeil } from "~/auth/session-utløpt.server";
import { skalBrukeMockdata } from "~/config/env.server";
import { logger } from "~/logging/logging";
import { hentOppgavekodeverk } from "~/saker/api.server";
import { mockOppgavekodeverk } from "~/testing/mock-store/kodeverk.server";
import type { OppgavekodeverkResultat } from "./oppgavekodeverk";
import { erTema } from "./tema";

/**
 * BFF for gjelderverdier og oppgavetyper på et tema. Klienten henter denne med
 * `fetch` når tema er valgt i oppgaveskjemaet.
 *
 * Feil fra backend returneres som et typet resultat, så skjemaet kan vise feilen
 * i stedet for at hele siden feiler. Utløpt sesjon (401) kastes videre.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  const tema = params.tema;
  if (!erTema(tema)) {
    throw data("Ugyldig tema", { status: 400 });
  }

  if (skalBrukeMockdata) {
    return { status: "ok", kodeverk: mockOppgavekodeverk[tema] } satisfies OppgavekodeverkResultat;
  }

  const token = await hentTokenEllerKast401(request);
  try {
    const kodeverk = await hentOppgavekodeverk(token, tema);
    return { status: "ok", kodeverk } satisfies OppgavekodeverkResultat;
  } catch (feil) {
    if (erUtloggetFeil(feil)) throw feil;
    logger.error("Kunne ikke hente kodeverk for oppgave");
    return data({ status: "feil" } satisfies OppgavekodeverkResultat, { status: 502 });
  }
}
