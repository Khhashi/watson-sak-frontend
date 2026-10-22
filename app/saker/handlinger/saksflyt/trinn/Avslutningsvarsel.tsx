import { LocalAlert } from "@navikt/ds-react";

/** Varsler om at saken ikke kan gjenåpnes etter avslutning. */
export function Avslutningsvarsel() {
  return (
    <LocalAlert status="warning">
      <LocalAlert.Header>
        <LocalAlert.Title as="h2">Tilgang til dokumenter og underlag</LocalAlert.Title>
      </LocalAlert.Header>
      <LocalAlert.Content>
        Når du avslutter saken kan ikke saken gjenåpnes og dokumenter som ikke er journalført vil
        ikke være tilgjengelige.
      </LocalAlert.Content>
    </LocalAlert>
  );
}
