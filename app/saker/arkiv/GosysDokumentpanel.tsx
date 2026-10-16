import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationmarkTriangleIcon,
  PadlockLockedIcon,
} from "@navikt/aksel-icons";
import { BodyShort, Button, Heading, HStack, InfoCard, Loader, VStack } from "@navikt/ds-react";
import { useEffect, useState, type ReactNode } from "react";
import { Kort } from "~/komponenter/Kort";
import { JournalpostTabell } from "./JournalpostTabell";
import type { ArkivJournalpost, OpprettetJournalpost } from "./typer";
import { useArkivJournalposter, type ArkivTilstand } from "./useArkivJournalposter";
import { tilJournalposttypekode } from "./visning";

interface GosysDokumentpanelProps {
  sakId: string;
  saksreferanse: string;
  /** Om brukeren har tilgang til å se journalposter i Gosys (`tilgang.kanSeArkiv`). */
  kanSeArkiv: boolean;
  /** Handlingsknapper som vises ved siden av «Vis dokumentoversikt». */
  renderHandlinger?: (props: {
    onJournalpostOpprettet: (journalpost: OpprettetJournalpost) => void;
  }) => ReactNode;
}

const feilmeldinger: Record<Extract<ArkivTilstand, { status: "feil" }>["årsak"], string> = {
  utilgjengelig: "Kunne ikke hente dokumentoversikten fra Gosys. Prøv igjen.",
  "for-mange-forespørsler": "Du har gjort for mange oppslag. Vent et par minutter og prøv igjen.",
  utlogget: "Sesjonen din er utløpt. Last inn siden på nytt for å logge inn.",
};

export function GosysDokumentpanel({
  sakId,
  saksreferanse,
  kanSeArkiv,
  renderHandlinger,
}: GosysDokumentpanelProps) {
  const [åpen, settÅpen] = useState(false);
  const { tilstand, ventendeIder, hent, journalpostOpprettet } = useArkivJournalposter(sakId);

  // Henter når panelet er åpent og ikke hentet, også om tilgangen kommer etter åpning.
  useEffect(() => {
    if (åpen && kanSeArkiv && tilstand.status === "ikke-hentet") void hent();
  }, [åpen, kanSeArkiv, tilstand.status, hent]);

  function veksleOversikt() {
    const skalÅpnes = !åpen;
    settÅpen(skalÅpnes);
    if (skalÅpnes && kanSeArkiv && tilstand.status === "feil") void hent();
  }

  function onJournalpostOpprettet(journalpost: OpprettetJournalpost) {
    if (!kanSeArkiv) return;
    settÅpen(true);
    journalpostOpprettet(tilVentendeJournalpost(journalpost));
  }

  const overskriftId = `gosys-dokumentoversikt-${sakId}`;
  const innholdId = `${overskriftId}-innhold`;

  return (
    <section aria-labelledby={overskriftId}>
      <Kort>
        <VStack gap="space-16">
          <VStack gap="space-4">
            <Heading level="2" size="small" id={overskriftId}>
              Dokumentoversikt i Gosys for sak {saksreferanse}
            </Heading>
            <BodyShort size="small">
              Journalføringer i Gosys for denne saken. Om du ønsker å se annet i Gosys må du gjøre
              dette i Gosys.
            </BodyShort>
          </VStack>

          <HStack gap="space-8" justify="space-between" align="center" wrap>
            <Button
              type="button"
              variant="tertiary"
              size="small"
              icon={åpen ? <ChevronUpIcon aria-hidden /> : <ChevronDownIcon aria-hidden />}
              aria-expanded={åpen}
              aria-controls={åpen ? innholdId : undefined}
              onClick={veksleOversikt}
            >
              {åpen ? "Lukk dokumentoversikt" : "Vis dokumentoversikt"}
            </Button>
            {renderHandlinger?.({ onJournalpostOpprettet })}
          </HStack>

          {åpen ? (
            <div id={innholdId}>
              <Innhold
                kanSeArkiv={kanSeArkiv}
                tilstand={tilstand}
                ventendeIder={ventendeIder}
                onPrøvIgjen={() => void hent()}
              />
            </div>
          ) : null}
        </VStack>
      </Kort>
    </section>
  );
}

/** Lokal tid uten tidssone, samme format som `datoOpprettet` fra SAF. */
function nåSomLokalIso(): string {
  const nå = new Date();
  return new Date(nå.getTime() - nå.getTimezoneOffset() * 60_000).toISOString().slice(0, 19);
}

function tilVentendeJournalpost(journalpost: OpprettetJournalpost): ArkivJournalpost | null {
  const { journalpostId } = journalpost;
  if (!journalpostId) return null;
  return {
    journalpostId,
    datoOpprettet: nåSomLokalIso(),
    journalposttype: tilJournalposttypekode(journalpost.journalposttype),
    journalstatus: null,
    tittel: journalpost.tittel,
    tema: null,
    temanavn: null,
    avsenderMottaker: null,
    dokumenter: journalpost.dokumenttitler.map((tittel, indeks) => ({
      dokumentInfoId: `${journalpostId}-${indeks}`,
      tittel,
    })),
  };
}

function Innhold({
  kanSeArkiv,
  tilstand,
  ventendeIder,
  onPrøvIgjen,
}: {
  kanSeArkiv: boolean;
  tilstand: ArkivTilstand;
  ventendeIder: ReadonlySet<string>;
  onPrøvIgjen: () => void;
}) {
  if (!kanSeArkiv) {
    return (
      <VStack gap="space-4" align="center" className="py-4 text-center">
        <PadlockLockedIcon aria-hidden fontSize="1.5rem" />
        <BodyShort size="small">
          Du har ikke tilgang til dokumentoversikten i Gosys for denne saken.
        </BodyShort>
      </VStack>
    );
  }

  switch (tilstand.status) {
    case "ikke-hentet":
    case "laster":
      return (
        <HStack justify="center" className="py-4">
          <Loader size="medium" title="Henter dokumentoversikten fra Gosys" />
        </HStack>
      );
    case "feil":
      return (
        <VStack gap="space-8" align="start">
          <InfoCard size="small" data-color="warning" className="w-full">
            <InfoCard.Message icon={<ExclamationmarkTriangleIcon aria-hidden />}>
              {feilmeldinger[tilstand.årsak]}
            </InfoCard.Message>
          </InfoCard>
          {tilstand.årsak !== "utlogget" ? (
            <Button type="button" size="small" variant="secondary" onClick={onPrøvIgjen}>
              Prøv igjen
            </Button>
          ) : null}
        </VStack>
      );
    case "ok":
      return tilstand.journalposter.length === 0 ? (
        <BodyShort size="small" textColor="subtle" className="py-4 text-center">
          Ingen journalføringer å vise for denne saken.
        </BodyShort>
      ) : (
        <JournalpostTabell journalposter={tilstand.journalposter} ventendeIder={ventendeIder} />
      );
  }
}
