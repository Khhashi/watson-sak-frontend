import type { FieldMetadata } from "@conform-to/react";
import { Radio, RadioGroup } from "@navikt/ds-react";
import { STANDARD_TEMA, type Tema, temaValg } from "./tema";

interface TemaVelgerProps {
  felt: FieldMetadata<Tema | undefined>;
}

/** Radioknapper for valg av tema (KTR eller KTA). Kontroll (KTR) er forhåndsvalgt. */
export function TemaVelger({ felt }: TemaVelgerProps) {
  return (
    <RadioGroup
      key={felt.key}
      name={felt.name}
      legend="Tema"
      error={felt.errors?.[0]}
      defaultValue={felt.initialValue ?? STANDARD_TEMA}
    >
      {temaValg.map(({ verdi, label }) => (
        <Radio key={verdi} value={verdi}>
          {`${label} (${verdi})`}
        </Radio>
      ))}
    </RadioGroup>
  );
}
