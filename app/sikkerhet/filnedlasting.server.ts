/**
 * Filtrerer et filsvar fra backend før det sendes til nettleseren.
 *
 * Filer serveres fra samme origin som appen. Hvis nettleseren rendrer en opplastet
 * HTML- eller SVG-fil, kjører skript i den med saksbehandlerens sesjon (stored XSS).
 * Derfor videresender vi bare et lite sett headere, og tvinger `attachment` for alt
 * som ikke står på allowlisten under, uansett hva backend sier.
 *
 * VIKTIG: TRYGGE_INLINE_TYPER skal holdes i sync med `TRYGGE_INLINE_TYPER` i
 * watson-admin-api (`FilController.kt`). Endrer du den ene, endre den andre.
 * Kommer listene ut av sync, lastes filen ned i stedet for å vises (trygg feil).
 */
const TRYGGE_INLINE_TYPER = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

function medietype(contentType: string): string {
  return contentType.split(";")[0]!.trim().toLowerCase();
}

function lagDisposisjon(backendDisposisjon: string | null, kanVisesInline: boolean): string {
  if (!backendDisposisjon) return "attachment";
  const [type, ...parametere] = backendDisposisjon.split(";");
  const erInline = type!.trim().toLowerCase() === "inline";
  const nyType = erInline && kanVisesInline ? "inline" : "attachment";
  return [nyType, ...parametere].join(";");
}

export function filtrerFilrespons(backendRespons: Response): Response {
  const contentType = backendRespons.headers.get("Content-Type") ?? "application/octet-stream";
  const kanVisesInline = TRYGGE_INLINE_TYPER.has(medietype(contentType));

  const headers = new Headers({
    "Content-Type": contentType,
    "Content-Disposition": lagDisposisjon(
      backendRespons.headers.get("Content-Disposition"),
      kanVisesInline,
    ),
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "sandbox",
    "Cache-Control": "no-store",
  });

  // fetch pakker ut komprimerte svar, så Content-Length stemmer bare uten Content-Encoding
  const contentLength = backendRespons.headers.get("Content-Length");
  if (contentLength && !backendRespons.headers.has("Content-Encoding")) {
    headers.set("Content-Length", contentLength);
  }

  return new Response(backendRespons.body, { status: backendRespons.status, headers });
}
