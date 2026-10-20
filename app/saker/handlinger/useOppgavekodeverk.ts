import { useCallback, useEffect, useState } from "react";
import { RouteConfig } from "~/routeConfig";
import { type Oppgavekodeverk, oppgavekodeverkResultatSchema } from "./oppgavekodeverk";
import type { Tema } from "./tema";

export type OppgavekodeverkTilstand =
  | { status: "uten-tema" }
  | { status: "laster" }
  | { status: "ok"; kodeverk: Oppgavekodeverk }
  | { status: "feil" };

// Kodeverket endres sjelden, så vi henter hvert tema én gang per sidevisning.
const hurtiglager = new Map<Tema, Oppgavekodeverk>();

/** Tømmer hurtiglageret. Brukes i tester. */
export function tømOppgavekodeverkHurtiglager() {
  hurtiglager.clear();
}

async function hentKodeverk(tema: Tema): Promise<Oppgavekodeverk | null> {
  try {
    const respons = await fetch(RouteConfig.API.OPPGAVEKODEVERK.replace(":tema", tema), {
      headers: { Accept: "application/json" },
      redirect: "manual",
    });
    if (!respons.ok) return null;
    const resultat = oppgavekodeverkResultatSchema.safeParse(await respons.json());
    if (!resultat.success || resultat.data.status !== "ok") return null;
    hurtiglager.set(tema, resultat.data.kodeverk);
    return resultat.data.kodeverk;
  } catch {
    return null;
  }
}

/** Henter gjelderverdier og oppgavetyper for temaet. Uten tema hentes ingenting. */
export function useOppgavekodeverk(tema: Tema | undefined) {
  const [hentet, settHentet] = useState<{
    tema: Tema;
    kodeverk: Oppgavekodeverk | null;
  } | null>(null);
  const [forsøk, settForsøk] = useState(0);

  useEffect(() => {
    if (!tema || hurtiglager.has(tema)) return;
    let gjeldende = true;
    void hentKodeverk(tema).then((kodeverk) => {
      if (gjeldende) settHentet({ tema, kodeverk });
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
  else if (hentet?.tema === tema && hentet.kodeverk === null) tilstand = { status: "feil" };
  else tilstand = { status: "laster" };

  return { tilstand, prøvIgjen };
}
