import { ArchiveIcon, ClipboardIcon } from "@navikt/aksel-icons";
import { HStack, Button } from "@navikt/ds-react";
import { type ReactNode, useState } from "react";
import type { OpprettetJournalpost } from "~/saker/arkiv/typer";
import type { ArkivOversikt } from "~/saker/arkiv/useArkivJournalposter";
import type { DokumentNode, FilResponse } from "~/saker/filer/typer";
import type { KontrollsakResponse } from "~/saker/types.backend";
import {
  ArkiverDokumenterModal,
  type ArkivertJournalpost,
} from "./arkivering/ArkiverDokumenterModal";
import { KnyttOppgaveModal } from "./arkivering/KnyttOppgaveModal";
import { OpprettOppgaveModal } from "./OpprettOppgaveModal";
import { hentTilgjengeligeSakshandlinger, type Sakshandling } from "./tilgjengeligeHandlinger";

interface SakHandlingerKnapperProps {
  sak: KontrollsakResponse;
  erEier: boolean;
  filer: FilResponse[];
  dokumenter: DokumentNode[];
  /** Kalles når en journalpost er opprettet, slik at dokumentoversikten kan hentes på nytt. */
  onJournalpostOpprettet?: (journalpost: OpprettetJournalpost) => void;
  /** Journalpostene på saken, som oppgaven kan knyttes til. */
  arkiv: ArkivOversikt;
}

const handlingsvisning: Record<
  Sakshandling,
  { label: string; variant: "primary" | "secondary"; ikon: ReactNode }
> = {
  "opprett-oppgave": {
    label: "Opprett oppgave i Gosys",
    variant: "secondary",
    ikon: <ClipboardIcon aria-hidden />,
  },
  "opprett-journalpost": {
    label: "Arkiver dokument(er) i Gosys",
    variant: "primary",
    ikon: <ArchiveIcon aria-hidden />,
  },
};

const rekkefølge: Sakshandling[] = ["opprett-oppgave", "opprett-journalpost"];

/** Knapper for å opprette oppgave og journalpost i Gosys. Vises bare for sakseier. */
export function SakHandlingerKnapper({
  sak,
  erEier,
  filer,
  dokumenter,
  onJournalpostOpprettet,
  arkiv,
}: SakHandlingerKnapperProps) {
  const [åpenModal, setÅpenModal] = useState<Sakshandling | null>(null);
  const [knyttTil, setKnyttTil] = useState<ArkivertJournalpost | null>(null);
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
                icon={visning.ikon}
                onClick={() => setÅpenModal(handling)}
              >
                {visning.label}
              </Button>
            );
          })}
      </HStack>

      <ArkiverDokumenterModal
        sakId={String(sak.id)}
        åpen={åpenModal === "opprett-journalpost"}
        onClose={() => setÅpenModal(null)}
        onOpprettet={onJournalpostOpprettet}
        onKnyttTilOppgave={(journalpost) => {
          setÅpenModal(null);
          setKnyttTil(journalpost);
        }}
        filer={filer}
        dokumenter={dokumenter}
      />
      <KnyttOppgaveModal
        sakId={String(sak.id)}
        journalpost={knyttTil}
        onClose={() => setKnyttTil(null)}
      />
      <OpprettOppgaveModal
        sakId={String(sak.id)}
        åpen={åpenModal === "opprett-oppgave"}
        onClose={() => setÅpenModal(null)}
        arkiv={arkiv}
      />
    </>
  );
}
