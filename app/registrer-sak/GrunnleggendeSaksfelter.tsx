import type { FieldMetadata } from "@conform-to/react";
import { HGrid, Select, TextField, UNSAFE_Combobox } from "@navikt/ds-react";
import { useEffect, useState } from "react";
import type { Kodeverk } from "~/saker/api.server";
import { merkingEtikett } from "~/saker/kategorier";
import { parseOrganisasjonsnumre } from "~/utils/string-utils";
import { oppdaterValgteMerkinger } from "./merking-utils";

type Felt = FieldMetadata<unknown, Record<string, unknown>, string[]>;

type Props = {
  fields: {
    kategori: Felt;
    misbruktype: Felt;
    kilde: Felt;
    enhet: Felt;
    merking: Felt;
    arbeidsgivere: Felt;
  };
  kodeverk: Kodeverk;
  tilgjengeligeMisbruktyper: string[];
  misbrukstypeBeskrivelseMap: Map<string, string>;
  valgteMisbruktyper: string[];
  setValgteMisbruktyper: (updater: (previous: string[]) => string[]) => void;
  valgteMerkinger: string[];
  setValgteMerkinger: (updater: (previous: string[]) => string[]) => void;
  valgteArbeidsgivere: string[];
  setValgteArbeidsgivere: (updater: (previous: string[]) => string[]) => void;
};

export function GrunnleggendeSaksfelter({
  fields,
  kodeverk,
  tilgjengeligeMisbruktyper,
  misbrukstypeBeskrivelseMap,
  valgteMisbruktyper,
  setValgteMisbruktyper,
  valgteMerkinger,
  setValgteMerkinger,
  valgteArbeidsgivere,
  setValgteArbeidsgivere,
}: Props) {
  const [organisasjonsnummerTekst, setOrganisasjonsnummerTekst] = useState(() =>
    valgteArbeidsgivere.join(", "),
  );
  useEffect(() => {
    if (valgteArbeidsgivere.length === 0) setOrganisasjonsnummerTekst("");
  }, [valgteArbeidsgivere]);

  return (
    <HGrid columns={{ xs: 1, md: 2 }} gap="space-24" className="max-w-[724px]">
      <Select
        key={fields.kategori.key}
        name={fields.kategori.name}
        id={fields.kategori.id}
        label="Kategori (må fylles ut)"
        error={fields.kategori.errors?.[0]}
        className="w-full max-w-[350px]"
        defaultValue={fields.kategori.initialValue as string | undefined}
        onChange={(e) => {
          const gyldige = kodeverk.misbrukstyper
            .filter((misbruktype) => misbruktype.kategori === e.target.value)
            .map((misbruktype) => misbruktype.kode);
          if (gyldige.length > 0) {
            setValgteMisbruktyper((prev) => prev.filter((m) => gyldige.includes(m)));
          } else {
            setValgteMisbruktyper(() => []);
          }
        }}
      >
        <option value="">Velg kategori</option>
        {kodeverk.kategorier.map((k) => (
          <option key={k.kode} value={k.kode}>
            {k.beskrivelse}
          </option>
        ))}
      </Select>

      <div id={fields.misbruktype.id} className="w-full max-w-[350px]">
        <UNSAFE_Combobox
          label="Misbrukstype"
          options={tilgjengeligeMisbruktyper.map((kode) => ({
            value: kode,
            label: misbrukstypeBeskrivelseMap.get(kode) ?? kode,
          }))}
          isMultiSelect
          disabled={tilgjengeligeMisbruktyper.length === 0}
          selectedOptions={valgteMisbruktyper.map((kode) => ({
            value: kode,
            label: misbrukstypeBeskrivelseMap.get(kode) ?? kode,
          }))}
          onToggleSelected={(option, isSelected) => {
            setValgteMisbruktyper((prev) => {
              if (isSelected) return prev.includes(option) ? prev : [...prev, option];
              return prev.filter((m) => m !== option);
            });
          }}
          error={fields.misbruktype.errors?.[0]}
        />
        {valgteMisbruktyper.map((m) => (
          <input key={m} type="hidden" name="misbruktype" value={m} />
        ))}
      </div>

      <Select
        key={fields.kilde.key}
        name={fields.kilde.name}
        id={fields.kilde.id}
        label="Kilde (må fylles ut)"
        error={fields.kilde.errors?.[0]}
        className="w-full max-w-[350px]"
        defaultValue={fields.kilde.initialValue as string | undefined}
      >
        <option value="">Velg kilde</option>
        {kodeverk.kilder.map((k) => (
          <option key={k.kode} value={k.kode}>
            {k.beskrivelse}
          </option>
        ))}
      </Select>
      <Select
        key={fields.enhet.key}
        name={fields.enhet.name}
        id={fields.enhet.id}
        label="Enhet (må fylles ut)"
        error={fields.enhet.errors?.[0]}
        className="w-full max-w-[350px]"
        defaultValue={fields.enhet.initialValue as string | undefined}
      >
        <option value="">Velg enhet</option>
        {kodeverk.enheter.map((e) => (
          <option key={e.kode} value={e.kode}>
            {e.beskrivelse}
          </option>
        ))}
      </Select>

      <div id={fields.merking.id} className="w-full max-w-[350px]">
        <UNSAFE_Combobox
          label="Merking"
          description="A-krimenhet eller andre definerte merker"
          options={kodeverk.merker.map((merke) => ({
            value: merke,
            label: merkingEtikett(merke),
          }))}
          isMultiSelect
          allowNewValues
          selectedOptions={valgteMerkinger.map((merke) => ({
            value: merke,
            label: merkingEtikett(merke),
          }))}
          onToggleSelected={(option, isSelected) => {
            setValgteMerkinger((prev) =>
              oppdaterValgteMerkinger(prev, option, isSelected, kodeverk.merker),
            );
          }}
          error={fields.merking.errors?.[0]}
        />
        {valgteMerkinger.map((m) => (
          <input key={m} type="hidden" name="merking" value={m} />
        ))}
      </div>

      <div className="w-full max-w-[350px]">
        <TextField
          id={fields.arbeidsgivere.id}
          label="Organisasjonsnummer"
          description="Dersom en bedrift bør knyttes til saken"
          className="w-full"
          value={organisasjonsnummerTekst}
          onChange={(event) => {
            const tekst = event.target.value;
            const numre = parseOrganisasjonsnumre(tekst);
            setOrganisasjonsnummerTekst(tekst);
            setValgteArbeidsgivere(() => numre);
          }}
          error={fields.arbeidsgivere.errors?.[0]}
        />
        {valgteArbeidsgivere.map((orgnr) => (
          <input key={orgnr} type="hidden" name="arbeidsgivere" value={orgnr} />
        ))}
      </div>
    </HGrid>
  );
}
