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
  /** Feltnavnet de valgte nøklene sendes inn med. */
  name: string;
  valgte: readonly string[];
  onChange: (valgte: string[]) => void;
  error?: string;
}

// Aksel-checkboksen er et grid med «width: fit-content». Uten min-w-0 vokser lange navn ut av modalen.
const avkortetEtikett = "max-w-full min-w-0 [&>label]:min-w-0";

/** Mappetre med avkrysning for filer og dokumenter som skal arkiveres i Gosys. */
export function ArkivValgTre({ tre, name, valgte, onChange, error }: ArkivValgTreProps) {
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
    // Hele stien kodes, slik at «Bank/2026» og «Bank 2026» ikke får samme ID.
    const innholdId = `${idPrefiks}-${encodeURIComponent(mappe.sti)}`;
    return (
      <li key={mappe.sti}>
        <div className="flex items-center gap-4">
          <div className="flex shrink-0 items-center gap-2">
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
            <FolderIcon aria-hidden fontSize="1.25rem" />
          </div>
          <Checkbox
            size="small"
            checked={avkrysning === "valgt"}
            indeterminate={avkrysning === "delvis"}
            disabled={!kanVelgeMappe(mappe, valgte)}
            onChange={() => onChange(veksleMappe(mappe, valgte))}
            className={avkortetEtikett}
          >
            <span className="block truncate" title={mappe.navn}>
              {mappe.navn}
            </span>
          </Checkbox>
        </div>
        {åpen && (
          <ul id={innholdId} className="pl-24">
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
          className={avkortetEtikett}
        >
          <span className="block truncate" title={element.navn}>
            {element.navn}
          </span>
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
      {valgte.map((nøkkel) => (
        <input key={nøkkel} type="hidden" name={name} value={nøkkel} />
      ))}
    </Fieldset>
  );
}
