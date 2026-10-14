/**
 * Vasker alt som sendes til Umami, slik at saksreferanser, dokument-ID-er og
 * query-strenger aldri forlater nettleseren.
 *
 * Brukes som Umamis `data-before-send`-hook. Funksjonen serialiseres med
 * `.toString()` til et inline-script, så den MÅ være selvstendig: ingen imports
 * og ingen referanser til symboler utenfor funksjonskroppen.
 */
export function anonymiserUmamiPayload(_type: string, payload: Record<string, unknown>) {
  const forbudteNøkler = ["sakId", "docId", "filId", "saksreferanse", "fnr", "ident"];

  const vaskSti = (verdi: string): string => {
    const urlMatch = /^([a-z][a-z0-9+.-]*:\/\/[^/?#]*)?([^?#]*)/i.exec(verdi);
    const origin = urlMatch?.[1] ?? "";
    const sti = (urlMatch?.[2] ?? "")
      .replace(/\/saker\/[^/]+/g, "/saker/:sakId")
      .replace(/\/dokumenter\/[^/]+/g, "/dokumenter/:docId");
    return origin + sti;
  };

  const vaskVerdi = (verdi: unknown): unknown => {
    if (typeof verdi === "string") {
      return verdi.startsWith("/") || /^[a-z][a-z0-9+.-]*:\/\//i.test(verdi)
        ? vaskSti(verdi)
        : verdi;
    }
    if (Array.isArray(verdi)) {
      return verdi.map(vaskVerdi);
    }
    if (verdi && typeof verdi === "object") {
      const resultat: Record<string, unknown> = {};
      for (const [nøkkel, underverdi] of Object.entries(verdi)) {
        if (!forbudteNøkler.includes(nøkkel)) {
          resultat[nøkkel] = vaskVerdi(underverdi);
        }
      }
      return resultat;
    }
    return verdi;
  };

  const vasket: Record<string, unknown> = { ...payload };
  if (typeof vasket.url === "string") vasket.url = vaskSti(vasket.url);
  if (typeof vasket.referrer === "string") vasket.referrer = vaskSti(vasket.referrer);
  if (vasket.data !== undefined) vasket.data = vaskVerdi(vasket.data);
  if (typeof vasket.url === "string" && vasket.url.includes("/saker/")) {
    vasket.title = vaskSti(vasket.url).replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]*/i, "");
  }
  return vasket;
}
