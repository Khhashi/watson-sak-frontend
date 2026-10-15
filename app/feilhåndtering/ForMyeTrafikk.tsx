import { BodyShort, Box, HGrid, Heading, Link, Page, VStack } from "@navikt/ds-react";
import { AppFooter } from "~/layout/AppFooter";
import { AppHeader } from "~/layout/AppHeader";
import { MiljøtilpassetTittel } from "~/layout/MiljøtilpassetTittel";

export function ForMyeTrafikk() {
  return (
    <Page footer={<AppFooter />}>
      <MiljøtilpassetTittel>Feil – Watson Sak</MiljøtilpassetTittel>
      <AppHeader />
      <Page.Block as="main" width="xl" gutters>
        <Box paddingBlock="space-80 space-32">
          <HGrid columns="minmax(auto,600px)" data-aksel-template="500-v2">
            <VStack gap="space-16">
              <VStack gap="space-12" align="start">
                <div>
                  <BodyShort textColor="subtle" size="small">
                    Statuskode 429
                  </BodyShort>
                  <Heading level="1" size="large" spacing>
                    Det er mye trafikk akkurat nå
                  </Heading>
                  <BodyShort spacing>
                    Watson har mange forespørsler for øyeblikket. Vent et par minutter og prøv
                    igjen.
                  </BodyShort>
                  <Link href="#" onClick={() => location.reload()}>
                    Last siden på nytt
                  </Link>
                </div>
              </VStack>
            </VStack>
          </HGrid>
        </Box>
      </Page.Block>
    </Page>
  );
}
