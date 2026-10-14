import type { LoaderFunctionArgs } from "react-router";
import { getBackendOboToken } from "~/auth/access-token";
import { hentInnloggetBruker } from "~/auth/innlogget-bruker.server";
import type { Miljø } from "~/config/backend-config";
import { env } from "~/config/env.server";

const brukereSomHarTilgang = {
  kristofer: "S162301",
  snorri: "E176931",
  espen: "E170973",
  alem: "B126228",
};

const testbrukereSomHarTilgang = ["Z993376", "Z993741", "Z993471", "Z990474"];

/**
 * Ruten deler ut backend-token, og skal bare finnes i miljøer uten ekte data.
 * Tillatelsesliste, ikke forbudsliste: nye miljøer er stengt til de legges til her.
 */
const miljøerMedTilgang: readonly Miljø[] = ["dev", "local-backend", "local-dev", "local-mock"];

export async function loader({ request }: LoaderFunctionArgs) {
  if (!miljøerMedTilgang.includes(env.ENVIRONMENT)) {
    throw new Response(null, { status: 404 });
  }

  const innloggetBruker = await hentInnloggetBruker({ request });
  const tillatteNavIdenter = [...Object.values(brukereSomHarTilgang), ...testbrukereSomHarTilgang];
  if (!tillatteNavIdenter.includes(innloggetBruker.navIdent)) {
    return Response.json({ error: "Du har ikke tilgang" }, { status: 403 });
  }

  const body =
    env.ENVIRONMENT === "local-mock"
      ? innloggetBruker
      : { ...innloggetBruker, token: await getBackendOboToken(request) };

  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}
