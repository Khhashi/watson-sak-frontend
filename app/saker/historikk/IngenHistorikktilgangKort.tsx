import { PadlockLockedIcon } from "@navikt/aksel-icons";
import { BodyShort, Heading, VStack } from "@navikt/ds-react";
import { Kort } from "~/komponenter/Kort";

const TEKST: Record<"ikke-delt" | "ingen-persontilgang", string> = {
  "ikke-delt": "Du må få delt tilgang til saken for å kunne se historikk.",
  "ingen-persontilgang":
    "Du har ikke tilgang til personen saken gjelder, og kan derfor ikke se historikk.",
};

interface IngenHistorikktilgangKortProps {
  /**
   * `"ikke-delt"`: innlogget bruker er verken sakseier eller delt-med.
   * `"ingen-persontilgang"`: tilgangsmaskinen gir ikke tilgang til personen saken gjelder
   * (`sak.tilgang.kanSeHistorikk` fra backend er `false`).
   */
  årsak: "ikke-delt" | "ingen-persontilgang";
}

/**
 * Vises i stedet for historikk når innlogget bruker ikke har tilgang til å se
 * den, etter samme mønster som `IngenFiltilgangKort` for dokumenter og
 * vedlegg.
 */
export function IngenHistorikktilgangKort({ årsak }: IngenHistorikktilgangKortProps) {
  return (
    <Kort>
      <VStack gap="space-4" align="center" className="text-center">
        <PadlockLockedIcon aria-hidden fontSize="1.5rem" />
        <Heading level="2" size="small">
          Historikk
        </Heading>
        <BodyShort size="small">{TEKST[årsak]}</BodyShort>
      </VStack>
    </Kort>
  );
}
