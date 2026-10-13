import { getBackendOboToken } from "~/auth/access-token";
import type { InnloggetBruker } from "~/auth/innlogget-bruker.server";
import { skalBrukeMockdata } from "~/config/env.server";
import { hentLederStatistikk } from "./api.server";
import { lagMockLederStatistikk, mockLedetEnheter } from "./mock.server";
import type { LederStatistikk } from "./types";

type HentLederOversiktDataArgs = {
  request: Request;
  innloggetBruker: InnloggetBruker;
};

const VALGT_ENHET_PARAM = "enhet";

/**
 * Henter ferdig aggregert lederstatistikk. Uten `?enhet=` utleder backend enheten
 * fra token og NOM. Ledere av flere enheter kan velge enhet med `?enhet=<id>`,
 * og backend avviser enheter brukeren ikke leder.
 */
export async function hentLederOversiktData({
  request,
  innloggetBruker,
}: HentLederOversiktDataArgs): Promise<LederStatistikk> {
  const valgtEnhetId = new URL(request.url).searchParams.get(VALGT_ENHET_PARAM);

  if (skalBrukeMockdata) {
    if (!innloggetBruker.enhetId) {
      throw new Error("Kan ikke lage mockstatistikk uten enhetstilhørighet.");
    }
    const ledetEnheter = mockLedetEnheter(innloggetBruker);
    const valgt = ledetEnheter.find((enhet) => enhet.id === valgtEnhetId) ?? ledetEnheter[0];
    return {
      ...lagMockLederStatistikk(request, valgt.id, valgt.navn),
      ledetEnheter,
    };
  }

  const token = await getBackendOboToken(request);
  return hentLederStatistikk(token, valgtEnhetId);
}
