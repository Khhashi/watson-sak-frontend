import type { FieldMetadata } from "@conform-to/react";
import { Select } from "@navikt/ds-react";
import { type Tema, temaValg } from "./tema";

interface TemaVelgerProps {
  felt: FieldMetadata<Tema | undefined>;
}

/** Nedtrekksliste for valg av tema (KTR eller KTA). Ingen verdi er forhåndsvalgt. */
export function TemaVelger({ felt }: TemaVelgerProps) {
  return (
    <Select
      key={felt.key}
      name={felt.name}
      id={felt.id}
      label="Tema"
      error={felt.errors?.[0]}
      defaultValue={felt.initialValue ?? ""}
    >
      <option value="">Velg tema</option>
      {temaValg.map(({ verdi, label }) => (
        <option key={verdi} value={verdi}>
          {`${label} (${verdi})`}
        </option>
      ))}
    </Select>
  );
}
