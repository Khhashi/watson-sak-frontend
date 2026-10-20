import { CheckmarkCircleFillIcon } from "@navikt/aksel-icons";
import { BodyShort, VStack } from "@navikt/ds-react";

interface SuksessVisningProps {
  tittel: string;
  tekst?: string;
}

/** Kvittering som vises i en modal når en handling er fullført. */
export function SuksessVisning({ tittel, tekst }: SuksessVisningProps) {
  return (
    <VStack gap="space-16" align="center" className="py-6 text-center">
      <CheckmarkCircleFillIcon aria-hidden fontSize="3rem" className="text-ax-bg-success-strong" />
      <VStack gap="space-4" align="center">
        <BodyShort weight="semibold">{tittel}</BodyShort>
        {tekst && <BodyShort textColor="subtle">{tekst}</BodyShort>}
      </VStack>
    </VStack>
  );
}
