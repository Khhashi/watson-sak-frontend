function normalisertNøkkel(merking: string): string {
  return merking.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();
}

function normalisertNyMerking(merking: string): string {
  const normalisert = normalisertNøkkel(merking);
  const tegn = Array.from(normalisert);
  if (tegn.length === 0) return "";
  const storForbokstav = tegn[0].toUpperCase();
  return (
    (Array.from(storForbokstav).length === 1 ? storForbokstav : tegn[0]) + tegn.slice(1).join("")
  );
}

function finnKatalogverdi(merking: string, katalog: string[]): string | undefined {
  const nøkkel = normalisertNøkkel(merking);
  return katalog.find((katalogverdi) => normalisertNøkkel(katalogverdi) === nøkkel);
}

function tilValgtVerdi(merking: string, katalog: string[]): string {
  return finnKatalogverdi(merking, katalog) ?? normalisertNyMerking(merking);
}

export function oppdaterValgteMerkinger(
  valgte: string[],
  merking: string,
  valgt: boolean,
  katalog: string[],
): string[] {
  const målverdi = tilValgtVerdi(merking, katalog);
  const målnøkkel = normalisertNøkkel(målverdi);
  const oppdatert: string[] = [];
  const settNøkler = new Set<string>();
  let målLagtTil = false;

  for (const tidligereValg of valgte) {
    const verdi = tilValgtVerdi(tidligereValg, katalog);
    const nøkkel = normalisertNøkkel(verdi);

    if (nøkkel === målnøkkel) {
      if (valgt && !målLagtTil) {
        oppdatert.push(målverdi);
        målLagtTil = true;
      }
      continue;
    }

    if (!settNøkler.has(nøkkel)) {
      oppdatert.push(verdi);
      settNøkler.add(nøkkel);
    }
  }

  if (valgt && !målLagtTil) oppdatert.push(målverdi);
  return oppdatert;
}
