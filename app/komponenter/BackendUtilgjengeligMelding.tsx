import { LocalAlert } from "@navikt/ds-react";

export function BackendUtilgjengeligMelding() {
  return (
    <LocalAlert status="error" size="small">
      Vi får ikke hentet saksdata fra baksystemet nå. Prøv igjen om litt.
    </LocalAlert>
  );
}
