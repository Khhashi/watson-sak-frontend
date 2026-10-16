import { useCallback, useRef, useState } from "react";
import { z } from "zod";
import { RouteConfig } from "~/routeConfig";
import { arkivJournalposterSchema, type ArkivJournalpost } from "./typer";

export type ArkivTilstand =
  | { status: "ikke-hentet" }
  | { status: "laster" }
  | { status: "ok"; journalposter: ArkivJournalpost[] }
  | { status: "feil"; årsak: "for-mange-forespørsler" | "utilgjengelig" | "utlogget" };

const resultatSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("ok"), journalposter: arkivJournalposterSchema }),
  z.object({
    status: z.literal("feil"),
    årsak: z.enum(["for-mange-forespørsler", "utilgjengelig"]),
  }),
]);

/**
 * Henter journalposter i Gosys for saken først når kalleren ber om det.
 *
 * Vi bruker `fetch` mot BFF-ruta i stedet for en fetcher: React Router revaliderer
 * fetchere etter hver action på siden, og hvert oppslag mot SAF audit-logges.
 * Her henter vi bare ved åpning, ved «Prøv igjen» og etter ny journalpost.
 */
export function useArkivJournalposter(sakId: string) {
  const [tilstand, settTilstand] = useState<ArkivTilstand>({ status: "ikke-hentet" });
  const sisteForespørsel = useRef(0);

  const hent = useCallback(async () => {
    const forespørsel = ++sisteForespørsel.current;
    const erGjeldende = () => forespørsel === sisteForespørsel.current;
    settTilstand((forrige) => (forrige.status === "ok" ? forrige : { status: "laster" }));

    try {
      const respons = await fetch(
        RouteConfig.API.SAK_ARKIV_JOURNALPOSTER.replace(":sakId", encodeURIComponent(sakId)),
        // Utløpt sesjon gir redirect til innlogging. Den skal ikke følges av fetch.
        { headers: { Accept: "application/json" }, redirect: "manual" },
      );
      if (!erGjeldende()) return;
      if (respons.status === 401 || respons.type === "opaqueredirect") {
        settTilstand({ status: "feil", årsak: "utlogget" });
        return;
      }
      const resultat = resultatSchema.safeParse(await respons.json());
      if (!erGjeldende()) return;
      settTilstand(resultat.success ? resultat.data : { status: "feil", årsak: "utilgjengelig" });
    } catch {
      if (erGjeldende()) settTilstand({ status: "feil", årsak: "utilgjengelig" });
    }
  }, [sakId]);

  return { tilstand, hent };
}
