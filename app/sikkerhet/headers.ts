/**
 * Bygger Content-Security-Policy med nonce.
 *
 * - `script-src`: kun egne filer, cdn.nav.no (sporingsskript) og inline-skript med riktig nonce.
 *   Ingen `unsafe-inline` eller `unsafe-eval`.
 * - `style-src`: beholder `unsafe-inline` fordi Aksel, Plate og React bruker `style`-attributter,
 *   som nonce ikke dekker. Stiler kan ikke kjøre kode.
 * - `img-src`: kun egne bilder (vedlegg via eget API) og `data:`. Eksterne bilder blokkeres, slik at
 *   bilder i dokumenter ikke kan brukes som sporingspiksler.
 */
export function lagContentSecurityPolicy({
  nonce,
  ekstraFormActionUrls = [],
}: {
  nonce: string;
  ekstraFormActionUrls?: string[];
}) {
  const formAction = ["'self'", ...ekstraFormActionUrls].join(" ");

  return (
    "default-src 'self'; " +
    `script-src 'self' https://cdn.nav.no 'nonce-${nonce}'; ` +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data:; " +
    "font-src 'self' data: cdn.nav.no; " +
    "connect-src 'self' telemetry.nav.no telemetry.ekstern.dev.nav.no umami.nav.no reops-event-proxy.nav.no reops-event-proxy.ekstern.dev.nav.no; " +
    "frame-src 'self' blob:; " +
    "frame-ancestors 'none'; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    `form-action ${formAction}`
  );
}

/** Sikkerhetsheadere uten CSP. CSP settes i `entry.server.tsx`, der nonce-en lages. */
export function sikkerhetHeaders() {
  return {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    // Skru av nettleserens gamle XSS-filter. Det kan misbrukes, og CSP beskytter oss i stedet.
    "X-XSS-Protection": "0",
    // Send aldri referrer (som kan inneholde saks-ID-er) til andre domener.
    "Referrer-Policy": "same-origin",
    "Permissions-Policy":
      "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  };
}
