import {
  ChevronDownIcon,
  ChevronUpIcon,
  InboxDownIcon,
  InboxUpIcon,
  NotePencilIcon,
} from "@navikt/aksel-icons";
import { Button, HStack, Loader, Table, Tooltip } from "@navikt/ds-react";
import { Fragment, type ComponentType, useState } from "react";
import type { ArkivJournalpost } from "./typer";
import {
  beskrivJournalposttype,
  formaterAvsenderMottaker,
  formaterJournalpostdato,
  formaterJournalstatus,
  formaterTema,
} from "./visning";

const typeikoner: Record<string, ComponentType<{ "aria-hidden"?: boolean }>> = {
  I: InboxDownIcon,
  U: InboxUpIcon,
  N: NotePencilIcon,
};

/** Har samme høyde som chevron-knappen, så alle rader blir like høye. */
function Radhøyde() {
  return <div aria-hidden className="h-6" />;
}

interface JournalpostTabellProps {
  journalposter: ArkivJournalpost[];
  /** Journalposter som er opprettet fra Watson Sak, men som Gosys ikke har vist ennå. */
  ventendeIder?: ReadonlySet<string>;
}

const ingenVentende: ReadonlySet<string> = new Set();

/**
 * Tabell over journalposter i Gosys. Hver journalpost kan utvides for å vise
 * dokumentene den består av. Dokumentradene ligger i samme kolonner som
 * journalposten, derfor bruker vi egne rader og ikke `Table.ExpandableRow`.
 */
export function JournalpostTabell({
  journalposter,
  ventendeIder = ingenVentende,
}: JournalpostTabellProps) {
  const [åpne, settÅpne] = useState<ReadonlySet<string>>(new Set());

  function veksle(journalpostId: string) {
    settÅpne((forrige) => {
      const neste = new Set(forrige);
      if (neste.has(journalpostId)) neste.delete(journalpostId);
      else neste.add(journalpostId);
      return neste;
    });
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-ax-border-neutral-subtle">
      <Table>
        <Table.Header>
          <Table.Row className="bg-ax-bg-neutral-soft">
            <Table.ColumnHeader scope="col">Dato</Table.ColumnHeader>
            <Table.ColumnHeader scope="col">Type</Table.ColumnHeader>
            <Table.ColumnHeader scope="col">Avsender/mottaker</Table.ColumnHeader>
            <Table.ColumnHeader scope="col">Dokumentbeskrivelse</Table.ColumnHeader>
            <Table.ColumnHeader scope="col">Status</Table.ColumnHeader>
            <Table.ColumnHeader scope="col">Tema</Table.ColumnHeader>
            <Table.ColumnHeader scope="col">
              <span className="sr-only">Dokumenter</span>
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {journalposter.map((journalpost) => {
            const erÅpen = åpne.has(journalpost.journalpostId);
            const dato = formaterJournalpostdato(journalpost.datoOpprettet);
            const typebeskrivelse = beskrivJournalposttype(journalpost.journalposttype);
            const tittel = journalpost.tittel ?? "Uten tittel";
            const knappetekst = erÅpen ? "Skjul dokumenter" : "Vis dokumenter";
            const harDokumenter = journalpost.dokumenter.length > 0;

            return (
              <Fragment key={journalpost.journalpostId}>
                <Table.Row>
                  <Table.DataCell className="whitespace-nowrap">{dato}</Table.DataCell>
                  <Table.DataCell>
                    {journalpost.journalposttype ? (
                      <Journalposttype
                        kode={journalpost.journalposttype}
                        beskrivelse={typebeskrivelse ?? journalpost.journalposttype}
                      />
                    ) : null}
                  </Table.DataCell>
                  <Table.DataCell>{formaterAvsenderMottaker(journalpost)}</Table.DataCell>
                  <Table.DataCell>{tittel}</Table.DataCell>
                  <Table.DataCell>
                    {ventendeIder.has(journalpost.journalpostId) ? (
                      <HStack gap="space-4" align="center" wrap={false}>
                        <Loader size="xsmall" aria-hidden />
                        <span className="whitespace-nowrap">Venter på Gosys</span>
                      </HStack>
                    ) : (
                      formaterJournalstatus(journalpost.journalstatus)
                    )}
                  </Table.DataCell>
                  <Table.DataCell>{formaterTema(journalpost)}</Table.DataCell>
                  <Table.DataCell align="right">
                    {harDokumenter ? (
                      <div className="flex justify-end">
                        <Tooltip content={knappetekst} describesChild>
                          <Button
                            type="button"
                            size="xsmall"
                            variant="tertiary-neutral"
                            icon={
                              erÅpen ? (
                                <ChevronUpIcon title={`${knappetekst} for ${tittel}`} />
                              ) : (
                                <ChevronDownIcon title={`${knappetekst} for ${tittel}`} />
                              )
                            }
                            aria-expanded={erÅpen}
                            onClick={() => veksle(journalpost.journalpostId)}
                          />
                        </Tooltip>
                      </div>
                    ) : (
                      <Radhøyde />
                    )}
                  </Table.DataCell>
                </Table.Row>
                {erÅpen
                  ? journalpost.dokumenter.map((dokument) => (
                      <Table.Row key={dokument.dokumentInfoId} className="bg-ax-bg-accent-soft">
                        <Table.DataCell className="whitespace-nowrap">{dato}</Table.DataCell>
                        <Table.DataCell />
                        <Table.DataCell />
                        <Table.DataCell colSpan={3}>
                          {dokument.tittel ?? "Dokument uten tittel"}
                        </Table.DataCell>
                        <Table.DataCell>
                          <Radhøyde />
                        </Table.DataCell>
                      </Table.Row>
                    ))
                  : null}
              </Fragment>
            );
          })}
        </Table.Body>
      </Table>
    </div>
  );
}

function Journalposttype({ kode, beskrivelse }: { kode: string; beskrivelse: string }) {
  const Ikon = typeikoner[kode];
  return (
    <Tooltip content={beskrivelse} describesChild>
      <HStack as="span" gap="space-4" align="center" wrap={false} className="w-fit">
        {Ikon ? <Ikon aria-hidden /> : null}
        <span aria-hidden>{kode}</span>
        <span className="sr-only">{beskrivelse}</span>
      </HStack>
    </Tooltip>
  );
}
