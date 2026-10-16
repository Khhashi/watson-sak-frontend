import { ChevronDownIcon, ChevronUpIcon } from "@navikt/aksel-icons";
import { Button, Table, Tooltip } from "@navikt/ds-react";
import { Fragment, useState } from "react";
import type { ArkivJournalpost } from "./typer";
import {
  beskrivJournalposttype,
  formaterAvsenderMottaker,
  formaterJournalpostdato,
  formaterJournalstatus,
  formaterTema,
} from "./visning";

interface JournalpostTabellProps {
  journalposter: ArkivJournalpost[];
}

/**
 * Tabell over journalposter i Gosys. Hver journalpost kan utvides for å vise
 * dokumentene den består av. Dokumentradene ligger i samme kolonner som
 * journalposten, derfor bruker vi egne rader og ikke `Table.ExpandableRow`.
 */
export function JournalpostTabell({ journalposter }: JournalpostTabellProps) {
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
      <Table size="small">
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
                      <>
                        <span aria-hidden title={typebeskrivelse ?? undefined}>
                          {journalpost.journalposttype}
                        </span>
                        <span className="sr-only">{typebeskrivelse}</span>
                      </>
                    ) : null}
                  </Table.DataCell>
                  <Table.DataCell>{formaterAvsenderMottaker(journalpost)}</Table.DataCell>
                  <Table.DataCell>{tittel}</Table.DataCell>
                  <Table.DataCell>
                    {formaterJournalstatus(journalpost.journalstatus)}
                  </Table.DataCell>
                  <Table.DataCell>{formaterTema(journalpost)}</Table.DataCell>
                  <Table.DataCell align="right">
                    {harDokumenter ? (
                      <Tooltip content={knappetekst} describesChild>
                        <Button
                          type="button"
                          size="small"
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
                    ) : null}
                  </Table.DataCell>
                </Table.Row>
                {erÅpen
                  ? journalpost.dokumenter.map((dokument) => (
                      <Table.Row key={dokument.dokumentInfoId} className="bg-ax-bg-accent-soft">
                        <Table.DataCell className="whitespace-nowrap">{dato}</Table.DataCell>
                        <Table.DataCell />
                        <Table.DataCell />
                        <Table.DataCell colSpan={4}>
                          {dokument.tittel ?? "Dokument uten tittel"}
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
