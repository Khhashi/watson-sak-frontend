import { useCallback, useEffect, useRef, useState } from "react";
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
 * Ventetid før hver bakgrunnshenting etter at en journalpost er opprettet.
 * SAF bruker litt tid før nye journalposter dukker opp.
 */
export const SYNK_FORSINKELSER_MS = [3000, 6000, 12000];

const ingenVentende: readonly ArkivJournalpost[] = [];

/**
 * Henter journalposter i Gosys for saken først når kalleren ber om det.
 *
 * Vi bruker `fetch` mot BFF-ruta i stedet for en fetcher: React Router revaliderer
 * fetchere etter hver action på siden, og hvert oppslag mot SAF audit-logges.
 * Her henter vi bare ved åpning, ved «Prøv igjen» og etter ny journalpost.
 *
 * En nyopprettet journalpost vises med en gang (optimistisk) og står som ventende
 * til den finnes i SAF. Vi henter i bakgrunnen etter `SYNK_FORSINKELSER_MS`.
 * Når forsøkene er brukt opp, kan brukeren oppdatere manuelt med `oppdater`.
 */
export function useArkivJournalposter(sakId: string) {
  const [tilstand, settTilstand] = useState<ArkivTilstand>({ status: "ikke-hentet" });
  const [ventende, settVentendeState] = useState<readonly ArkivJournalpost[]>(ingenVentende);
  const ventendeRef = useRef<readonly ArkivJournalpost[]>(ingenVentende);
  const sisteForespørsel = useRef(0);
  const synkTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const synkForsøk = useRef(0);
  const harHentet = useRef(false);
  const avmontert = useRef(false);
  const [synkUttømt, settSynkUttømt] = useState(false);
  const bakgrunnshent = useRef<() => void>(() => {});

  const settVentende = useCallback((neste: readonly ArkivJournalpost[]) => {
    ventendeRef.current = neste;
    settVentendeState(neste);
  }, []);

  const planleggSynk = useCallback(() => {
    if (avmontert.current || synkTimer.current !== undefined) return;
    const forsinkelse = SYNK_FORSINKELSER_MS[synkForsøk.current];
    if (forsinkelse === undefined) {
      settSynkUttømt(true);
      return;
    }
    synkForsøk.current += 1;
    synkTimer.current = setTimeout(() => {
      synkTimer.current = undefined;
      bakgrunnshent.current();
    }, forsinkelse);
  }, []);

  // Ved avmontering avvises svar på pågående hentinger, så de ikke planlegger nye oppslag.
  useEffect(() => {
    avmontert.current = false;
    return () => {
      avmontert.current = true;
      sisteForespørsel.current += 1;
      clearTimeout(synkTimer.current);
      synkTimer.current = undefined;
    };
  }, []);

  const hent = useCallback(
    async ({ bakgrunn = false }: { bakgrunn?: boolean } = {}) => {
      const forespørsel = ++sisteForespørsel.current;
      const erGjeldende = () => forespørsel === sisteForespørsel.current;
      harHentet.current = true;
      settTilstand((forrige) => (forrige.status === "ok" ? forrige : { status: "laster" }));

      // En bakgrunnshenting som feiler skal ikke skjule listen som allerede vises.
      const settFeil = (årsak: Extract<ArkivTilstand, { status: "feil" }>["årsak"]) => {
        settTilstand((forrige) =>
          bakgrunn && forrige.status === "ok" ? forrige : { status: "feil", årsak },
        );
        if (ventendeRef.current.length > 0) planleggSynk();
      };

      try {
        const respons = await fetch(
          RouteConfig.API.SAK_ARKIV_JOURNALPOSTER.replace(":sakId", encodeURIComponent(sakId)),
          // Utløpt sesjon gir redirect til innlogging. Den skal ikke følges av fetch.
          { headers: { Accept: "application/json" }, redirect: "manual" },
        );
        if (!erGjeldende()) return;
        if (respons.status === 401 || respons.type === "opaqueredirect") {
          settFeil("utlogget");
          return;
        }
        const resultat = resultatSchema.safeParse(await respons.json());
        if (!erGjeldende()) return;
        if (!resultat.success) {
          settFeil("utilgjengelig");
          return;
        }
        if (resultat.data.status === "feil") {
          settFeil(resultat.data.årsak);
          return;
        }

        const hentede = new Set(resultat.data.journalposter.map((jp) => jp.journalpostId));
        const uløste = ventendeRef.current.filter((jp) => !hentede.has(jp.journalpostId));
        if (uløste.length !== ventendeRef.current.length) settVentende(uløste);
        settTilstand(resultat.data);
        if (uløste.length > 0) planleggSynk();
        else settSynkUttømt(false);
      } catch {
        if (erGjeldende()) settFeil("utilgjengelig");
      }
    },
    [sakId, planleggSynk, settVentende],
  );

  useEffect(() => {
    bakgrunnshent.current = () => void hent({ bakgrunn: true });
  }, [hent]);

  /**
   * Viser journalposten med en gang og synkroniserer med Gosys i bakgrunnen.
   * Er oversikten ikke hentet ennå, hentes den først når den åpnes.
   */
  const journalpostOpprettet = useCallback(
    (journalpost: ArkivJournalpost | null) => {
      if (journalpost) {
        settVentende([
          journalpost,
          ...ventendeRef.current.filter((jp) => jp.journalpostId !== journalpost.journalpostId),
        ]);
      }
      clearTimeout(synkTimer.current);
      synkTimer.current = undefined;
      synkForsøk.current = 0;
      settSynkUttømt(false);
      if (harHentet.current) planleggSynk();
    },
    [planleggSynk, settVentende],
  );

  /** Manuell synk når de automatiske forsøkene er brukt opp. */
  const oppdater = useCallback(() => {
    settSynkUttømt(false);
    void hent({ bakgrunn: true });
  }, [hent]);

  const synligTilstand: ArkivTilstand =
    tilstand.status === "ok" && ventende.length > 0
      ? { status: "ok", journalposter: [...ventende, ...tilstand.journalposter] }
      : tilstand;

  return {
    tilstand: synligTilstand,
    /** Ventende journalposter, også før oversikten er hentet. */
    ventende,
    ventendeIder: new Set(ventende.map((jp) => jp.journalpostId)),
    synkUttømt: synkUttømt && ventende.length > 0,
    hent,
    oppdater,
    journalpostOpprettet,
  };
}
