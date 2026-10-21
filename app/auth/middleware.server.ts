import type { MiddlewareFunction } from "react-router";
import { env } from "~/config/env.server";
import { RouteConfig } from "~/routeConfig";
import { getValidToken } from "./access-token";

const offentligeStier = new Set<string>([
  RouteConfig.API.HEALTH,
  RouteConfig.API.VERSION,
  RouteConfig.WELL_KNOWN.SECURITY_TXT,
]);

export const krevInnloggingMiddleware: MiddlewareFunction<Response> = async (
  { request, url },
  next,
) => {
  const sti = url.pathname.replace(/\/+$/, "");
  if (env.ENVIRONMENT === "local-mock" || offentligeStier.has(sti)) {
    return next();
  }

  try {
    await getValidToken(request);
  } catch (feil) {
    // Forhåndsutfylling sendes som dokumentnavigasjon og trenger innloggingsredirect.
    const erApiKall =
      sti.startsWith("/api/") && sti !== encodeURI(RouteConfig.API.FORHÅNDSUTFYLL_REGISTRER_SAK);
    if (erApiKall && feil instanceof Response && feil.status >= 300 && feil.status < 400) {
      throw new Response("Sesjonen er utløpt. Logg inn på nytt.", { status: 401 });
    }
    throw feil;
  }

  return next();
};
