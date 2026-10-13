import { ToggleGroup, VStack } from "@navikt/ds-react";
import { useSearchParams } from "react-router";
import { AnsatteOversikt } from "./komponenter/AnsatteOversikt";
import type { LederStatistikk } from "./types";

export interface LederOversiktProps {
  statistikk: LederStatistikk;
}

/** Hoveddashboardet ledere ser på forsiden i stedet for saksbehandlers
 * personlige oversikt. Ledere av flere enheter velger én enhet om gangen. */
export function LederOversikt({ statistikk }: LederOversiktProps) {
  const [, setSearchParams] = useSearchParams();

  return (
    <VStack gap="space-12">
      {statistikk.ledetEnheter.length > 1 ? (
        <ToggleGroup
          label="Vis enhet"
          value={statistikk.enhetId}
          onChange={(enhetId) =>
            setSearchParams(
              (params) => {
                params.set("enhet", enhetId);
                return params;
              },
              { preventScrollReset: true },
            )
          }
        >
          {statistikk.ledetEnheter.map((enhet) => (
            <ToggleGroup.Item key={enhet.id} value={enhet.id}>
              {enhet.navn}
            </ToggleGroup.Item>
          ))}
        </ToggleGroup>
      ) : null}
      <AnsatteOversikt ansatte={statistikk.ansatte} enhetId={statistikk.enhetId} />
    </VStack>
  );
}
