import { BackendFeilException } from "~/saker/api-core.server";

export class BackendUtilgjengeligError extends Error {
  constructor() {
    super("Nødvendige saksdata er midlertidig utilgjengelige.");
    this.name = "BackendUtilgjengeligError";
  }
}

export function erBackendUtilgjengelig(
  feil: unknown,
): feil is BackendUtilgjengeligError | BackendFeilException {
  return (
    (feil instanceof Error && feil.name === "BackendUtilgjengeligError") ||
    (feil instanceof BackendFeilException && feil.status === 503)
  );
}

export async function hentParEllerUtilgjengelig<T1, T2>(
  første: Promise<T1>,
  andre: Promise<T2>,
): Promise<
  { saksdataUtilgjengelig: true } | { saksdataUtilgjengelig: false; resultater: [T1, T2] }
> {
  const [førsteResultat, andreResultat] = await Promise.allSettled([første, andre]);

  const ikkeUtilgjengeligFeil = [førsteResultat, andreResultat].find(
    (resultat) => resultat.status === "rejected" && !erBackendUtilgjengelig(resultat.reason),
  );
  if (ikkeUtilgjengeligFeil?.status === "rejected") {
    throw ikkeUtilgjengeligFeil.reason;
  }

  if (førsteResultat.status === "rejected" || andreResultat.status === "rejected") {
    return { saksdataUtilgjengelig: true };
  }

  return {
    saksdataUtilgjengelig: false,
    resultater: [førsteResultat.value, andreResultat.value],
  };
}
