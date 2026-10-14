import type { MiddlewareFunction } from "react-router";

/**
 * Setter `Cache-Control: no-store` på alle svar fra React Router: dokumenter, `.data`-forespørsler
 * og API-ruter. Alt appen svarer med er personlig og krever innlogging, så ingenting skal ligge i
 * nettleser- eller proxy-cache.
 *
 * Statiske filer (`/assets/*` og `public/`) serveres av `react-router-serve` før React Router,
 * og beholder sine egne cache-headere.
 */
export const ingenCacheMiddleware: MiddlewareFunction<Response> = async (_args, next) => {
  const respons = await next();
  try {
    respons.headers.set("Cache-Control", "no-store");
    return respons;
  } catch {
    // Headerne er låst (f.eks. et svar fra `fetch` eller `Response.redirect`). Lag en kopi.
    const kopi = new Response(respons.body, respons);
    kopi.headers.set("Cache-Control", "no-store");
    return kopi;
  }
};
