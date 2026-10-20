import { ChevronDownIcon, ChevronUpIcon, FolderIcon } from "@navikt/aksel-icons";
import { Button, Checkbox, Fieldset } from "@navikt/ds-react";
import { useId, useState } from "react";
import {
  MAKS_ANTALL_VALGTE,
  kanVelgeMappe,
  mappeAvkrysning,
  veksleMappe,
  type ArkivElement,
  type ArkivMappe,
  type ArkivTre,
} from "./arkivvalg";

interface ArkivValgTreProps {
  tre: ArkivTre;
  valgte: readonly string[];
  onChange: (valgte: string[]) => void;
  error?: string;
}

/** Mappetre med avkrysning for filer og dokumenter som skal arkiveres i Gosys. */
export function ArkivValgTre({ tre, valgte, onChange, error }: ArkivValgTreProps) {
  const idPrefiks = useId();
  const [åpneMapper, settÅpneMapper] = useState<ReadonlySet<string>>(new Set());

  function veksleÅpen(sti: string) {
    settÅpneMapper((forrige) => {
      const neste = new Set(forrige);
      if (neste.has(sti)) neste.delete(sti);
      else neste.add(sti);
      return neste;
    });
  }

  function veksleElement(nøkkel: string) {
    onChange(
      valgte.includes(nøkkel) ? valgte.filter((valgt) => valgt !== nøkkel) : [...valgte, nøkkel],
    );
  }

  function visInnhold(node: ArkivTre) {
    return (
      <>
        {node.undermapper.map(visMappe)}
        {node.elementer.map(visElement)}
      </>
    );
  }

  function visMappe(mappe: ArkivMappe) {
    const åpen = åpneMapper.has(mappe.sti);
    const avkrysning = mappeAvkrysning(mappe, valgte);
    const innholdId = `${idPrefiks}-${mappe.sti.replace(/[^\p{L}\p{N}]+/gu, "-")}`;
    return (
      <li key={mappe.sti}>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="tertiary-neutral"
            size="xsmall"
            icon={åpen ? <ChevronUpIcon aria-hidden /> : <ChevronDownIcon aria-hidden />}
            aria-label={`${åpen ? "Skjul" : "Vis"} innhold i ${mappe.navn}`}
            aria-expanded={åpen}
            aria-controls={åpen ? innholdId : undefined}
            onClick={() => veksleÅpen(mappe.sti)}
          />
          <FolderIcon aria-hidden fontSize="1.25rem" className="shrink-0" />
          <Checkbox
            size="small"
            checked={avkrysning === "valgt"}
            indeterminate={avkrysning === "delvis"}
            disabled={!kanVelgeMappe(mappe, valgte)}
            onChange={() => onChange(veksleMappe(mappe, valgte))}
          >
            {mappe.navn}
          </Checkbox>
        </div>
        {åpen && (
          <ul id={innholdId} className="pl-12">
            {visInnhold(mappe)}
          </ul>
        )}
      </li>
    );
  }

  function visElement(element: ArkivElement) {
    const valgt = valgte.includes(element.nøkkel);
    return (
      <li key={element.nøkkel}>
        <Checkbox
          size="small"
          checked={valgt}
          disabled={!valgt && valgte.length >= MAKS_ANTALL_VALGTE}
          onChange={() => veksleElement(element.nøkkel)}
        >
          {element.navn}
        </Checkbox>
      </li>
    );
  }

  return (
    <Fieldset
      legend="Filer og dokumenter fra saken"
      description={`Velg filer og dokumenter som skal arkiveres sammen med journalposten i Gosys. Maks ${MAKS_ANTALL_VALGTE} totalt.`}
      error={error}
    >
      <ul>{visInnhold(tre)}</ul>
    </Fieldset>
  );
}
