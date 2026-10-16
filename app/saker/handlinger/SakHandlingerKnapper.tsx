import { HStack, Button } from "@navikt/ds-react";
import { useState } from "react";
import type { DokumentNode, FilResponse } from "~/saker/filer/typer";
import type { KontrollsakResponse } from "~/saker/types.backend";
import { OpprettJournalpostModal } from "./OpprettJournalpostModal";
import { OpprettOppgaveModal } from "./OpprettOppgaveModal";
import { hentTilgjengeligeSakshandlinger, type Sakshandling } from "./tilgjengeligeHandlinger";

interface SakHandlingerKnapperProps {
  sak: KontrollsakResponse;
  erEier: boolean;
  filer: FilResponse[];
  dokumenter: DokumentNode[];
  /** Kalles når en journalpost er opprettet, slik at dokumentoversikten kan hentes på nytt. */
  onJournalpostOpprettet?: () => void;
}

const handlingsvisning: Record<Sakshandling, { label: string; variant: "primary" | "secondary" }> =
  {
    "opprett-oppgave": { label: "Opprett oppgave i Gosys", variant: "secondary" },
    "opprett-journalpost": { label: "Arkiver dokument(er) i Gosys", variant: "primary" },
  };

const rekkefølge: Sakshandling[] = ["opprett-oppgave", "opprett-journalpost"];

/** Knapper for å opprette oppgave og journalpost i Gosys. Vises bare for sakseier. */
export function SakHandlingerKnapper({
  sak,
  erEier,
  filer,
  dokumenter,
  onJournalpostOpprettet,
}: SakHandlingerKnapperProps) {
  const [åpenModal, setÅpenModal] = useState<Sakshandling | null>(null);
  const handlinger = hentTilgjengeligeSakshandlinger(sak);

  if (!erEier || handlinger.length === 0) {
    return null;
  }

  return (
    <>
      <HStack gap="space-8" wrap>
        {rekkefølge
          .filter((handling) => handlinger.includes(handling))
          .map((handling) => {
            const visning = handlingsvisning[handling];
            return (
              <Button
                key={handling}
                type="button"
                variant={visning.variant}
                size="small"
                onClick={() => setÅpenModal(handling)}
              >
                {visning.label}
              </Button>
            );
          })}
      </HStack>

      <OpprettJournalpostModal
        sakId={String(sak.id)}
        åpen={åpenModal === "opprett-journalpost"}
        onClose={() => setÅpenModal(null)}
        onOpprettet={onJournalpostOpprettet}
        filer={filer}
        dokumenter={dokumenter}
      />
      <OpprettOppgaveModal
        sakId={String(sak.id)}
        åpen={åpenModal === "opprett-oppgave"}
        onClose={() => setÅpenModal(null)}
      />
    </>
  );
}
