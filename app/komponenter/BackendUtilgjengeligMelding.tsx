import { LocalAlert } from "@navikt/ds-react";

export function BackendUtilgjengeligMelding() {
  return (
    <LocalAlert status="error">
      <LocalAlert.Header>
        <LocalAlert.Title as="h2">Saksdata er ikke tilgjengelig</LocalAlert.Title>
      </LocalAlert.Header>
      <LocalAlert.Content>
        Vi får ikke hentet saksdata fra baksystemet nå. Prøv igjen om litt.
      </LocalAlert.Content>
    </LocalAlert>
  );
}
