import { useLoaderData } from "react-router";
import { getBackendOboToken } from "~/auth/access-token";
import { skalBrukeMockdata } from "~/config/env.server";
import { RouteConfig } from "~/routeConfig";
import { erBackendUtilgjengelig } from "~/utils/backend-utilgjengelig.server";
import * as backendApi from "~/saker/api.server";
import { mockSaksbehandlere, mockSaksbehandlerDetaljer } from "~/saker/mock-saksbehandlere.server";
import { action, loader as lastSakerForFordeling } from "./FordelingSide.server";
import { UfordelteSakerInnhold } from "./UfordelteSakerInnhold";

export { action };

/** Tabellen med ufordelte saker er bred, så siden ber layouten om å slippe
 * maks-bredden for å unngå unødvendig horisontal scroll på brede skjermer. */
export const handle = { bredPageBlock: true };

export async function loader(args: Parameters<typeof lastSakerForFordeling>[0]) {
  let saker: Awaited<ReturnType<typeof lastSakerForFordeling>>["saker"];
  let enhet: string | null;
  try {
    ({ saker, enhet } = await lastSakerForFordeling(args));
  } catch (feil) {
    if (!erBackendUtilgjengelig(feil)) throw feil;
    return {
      saker: [],
      enhet: null,
      saksbehandlere: [],
      saksbehandlerDetaljer: [],
      saksdataUtilgjengelig: true,
    };
  }

  if (!skalBrukeMockdata) {
    const token = await getBackendOboToken(args.request);
    const saksbehandlerDetaljer = await backendApi.hentSaksbehandlere(token);
    return {
      saker,
      enhet,
      saksbehandlere: saksbehandlerDetaljer.map((sb) => sb.navn),
      saksbehandlerDetaljer,
      saksdataUtilgjengelig: false,
    };
  }

  return {
    saker,
    enhet,
    saksbehandlere: mockSaksbehandlere,
    saksbehandlerDetaljer: mockSaksbehandlerDetaljer,
    saksdataUtilgjengelig: false,
  };
}

export default function FordelingSide() {
  const { saker, enhet, saksbehandlere, saksbehandlerDetaljer, saksdataUtilgjengelig } =
    useLoaderData<typeof loader>();

  return (
    <UfordelteSakerInnhold
      saker={saker}
      enhet={enhet}
      saksbehandlere={saksbehandlere}
      saksbehandlerDetaljer={saksbehandlerDetaljer}
      saksdataUtilgjengelig={saksdataUtilgjengelig}
      submitPath={RouteConfig.FORDELING}
    />
  );
}
