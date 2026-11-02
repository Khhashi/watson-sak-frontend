import { Heading, HStack, Pagination, VStack } from "@navikt/ds-react";
import { PersonGroupIcon } from "@navikt/aksel-icons";
import { useSearchParams } from "react-router";
import type { KontrollsakResponse } from "~/saker/types.backend";
import { mapKontrollsakTilSakslisteRad } from "~/saker/saksliste/adaptere";
import { Saksliste } from "~/saker/saksliste/Saksliste";
import { RouteConfig } from "~/routeConfig";

type Paginering = {
  side: number;
  totalSider: number;
  totalAntall: number;
};

type Props = {
  saker: KontrollsakResponse[];
  paginering?: Paginering;
  detaljSti: string;
};

export function DeltMedMegSeksjon({ saker, paginering, detaljSti }: Props) {
  const [, setSearchParams] = useSearchParams();

  if (saker.length === 0) return null;

  function gåTilSide(side: number) {
    setSearchParams((forrige) => {
      const neste = new URLSearchParams(forrige);
      neste.set("deltSide", String(side));
      return neste;
    });
  }

  return (
    <section aria-labelledby="delt-med-meg-overskrift">
      <VStack gap="space-6">
        <HStack gap="space-4" align="center">
          <PersonGroupIcon aria-hidden fontSize="1.25rem" />
          <Heading id="delt-med-meg-overskrift" level="2" size="medium">
            Delt med meg
          </Heading>
        </HStack>
        <Saksliste
          rader={saker.map((sak) => mapKontrollsakTilSakslisteRad(sak, detaljSti))}
          tomTekst="Ingen saker er delt med deg."
          tilbake={{ to: RouteConfig.MINE_SAKER, label: "Mine saker" }}
        />
        {paginering && paginering.totalSider > 1 && (
          <HStack justify="center">
            <Pagination
              page={paginering.side}
              onPageChange={gåTilSide}
              count={paginering.totalSider}
              size="small"
            />
          </HStack>
        )}
      </VStack>
    </section>
  );
}
