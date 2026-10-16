import { PadlockLockedIcon } from "@navikt/aksel-icons";
import { BodyShort, Heading, VStack } from "@navikt/ds-react";
import { Kort } from "~/komponenter/Kort";

const TEKST: Record<"ikke-delt" | "ingen-persontilgang", string> = {
  "ikke-delt": "Du må få delt tilgang til saken for å kunne se dokumenter og vedlegg.",
  "ingen-persontilgang":
    "Du har ikke tilgang til personen saken gjelder, og kan derfor ikke se dokumenter og vedlegg.",
};

interface IngenFiltilgangKortProps {
  /**
   * `"ikke-delt"`: innlogget bruker er verken sakseier eller delt-med.
   * `"ingen-persontilgang"`: tilgangsmaskinen gir ikke tilgang til personen saken gjelder
   * (`sak.tilgang.kanSeFiler` fra backend er `false`).
   */
  årsak: "ikke-delt" | "ingen-persontilgang";
}

/**
 * Vises i stedet for dokumenter og vedlegg når innlogget bruker ikke har tilgang
 * til å se dem. Filområdet kan i praksis vise innhold uten reell tilgang for enkelte
 * tilgrensende roller (f.eks. ansvarlig på en koblet sak), men den enkelte
 * dokumentsiden krever direkte tilgang — derfor skjules hele blokken heller enn å
 * vise lenker brukeren ikke kan åpne.
 */
export function IngenFiltilgangKort({ årsak }: IngenFiltilgangKortProps) {
  return (
    <Kort>
      <VStack gap="space-4" align="center" className="text-center">
        <PadlockLockedIcon aria-hidden fontSize="1.5rem" />
        <Heading level="2" size="small">
          Dokumenter og vedlegg
        </Heading>
        <BodyShort size="small">{TEKST[årsak]}</BodyShort>
      </VStack>
    </Kort>
  );
}
