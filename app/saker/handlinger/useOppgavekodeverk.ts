import { useCallback, useEffect, useState } from "react";
import { RouteConfig } from "~/routeConfig";
import { type Oppgavekodeverk, oppgavekodeverkResultatSchema } from "./oppgavekodeverk";
import type { Tema } from "./tema";

export type OppgavekodeverkTilstand =
  | { status: "uten-tema" }
  | { status: "laster" }
  | { status: "ok"; kodeverk: Oppgavekodeverk }
  | { status: "feil" }
  | { status: "utlogget" };

type Hentefeil = "feil" | "utlogget";

// Kodeverket endres sjelden, så vi henter hvert tema én gang per sidevisning.
const hurtiglager = new Map<Tema, Oppgavekodeverk>();

/** Tømmer hurtiglageret. Brukes i tester. */
export function tømOppgavekodeverkHurtiglager() {
  hurtiglager.clear();
}

async function hentKodeverk(tema: Tema): Promise<Oppgavekodeverk | Hentefeil> {
  try {
    const respons = await fetch(RouteConfig.API.OPPGAVEKODEVERK.replace(":tema", tema), {
      headers: { Accept: "application/json" },
      // Utløpt sesjon gir redirect til innlogging. Den skal ikke følges av fetch.
      redirect: "manual",
    });
    if (respons.status === 401 || respons.type === "opaqueredirect") return "utlogget";
    if (!respons.ok) return "feil";
    const resultat = oppgavekodeverkResultatSchema.safeParse(await respons.json());
    if (!resultat.success || resultat.data.status !== "ok") return "feil";
    hurtiglager.set(tema, resultat.data.kodeverk);
    return resultat.data.kodeverk;
  } catch {
    return "feil";
  }
}

/** Henter gjelderverdier og oppgavetyper for temaet. Uten tema hentes ingenting. */
export function useOppgavekodeverk(tema: Tema | undefined) {
  const [hentet, settHentet] = useState<{
    tema: Tema;
    resultat: Oppgavekodeverk | Hentefeil;
  } | null>(null);
  const [forsøk, settForsøk] = useState(0);

  useEffect(() => {
    if (!tema || hurtiglager.has(tema)) return;
    let gjeldende = true;
    void hentKodeverk(tema).then((resultat) => {
      if (gjeldende) settHentet({ tema, resultat });
    });
    return () => {
      gjeldende = false;
    };
  }, [tema, forsøk]);

  const prøvIgjen = useCallback(() => {
    settHentet(null);
    settForsøk((n) => n + 1);
  }, []);

  let tilstand: OppgavekodeverkTilstand;
  const lagret = tema ? hurtiglager.get(tema) : undefined;
  if (!tema) tilstand = { status: "uten-tema" };
  else if (lagret) tilstand = { status: "ok", kodeverk: lagret };
  else if (hentet?.tema === tema && typeof hentet.resultat === "string")
    tilstand = { status: hentet.resultat };
  else tilstand = { status: "laster" };

  return { tilstand, prøvIgjen };
}
