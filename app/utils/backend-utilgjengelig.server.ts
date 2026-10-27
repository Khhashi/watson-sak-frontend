export class BackendUtilgjengeligError extends Error {
  constructor() {
    super("Nødvendige saksdata er midlertidig utilgjengelige.");
    this.name = "BackendUtilgjengeligError";
  }
}

export function erBackendUtilgjengelig(feil: unknown): feil is BackendUtilgjengeligError {
  return feil instanceof Error && feil.name === "BackendUtilgjengeligError";
}
