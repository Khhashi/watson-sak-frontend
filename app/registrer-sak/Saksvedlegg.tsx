import { UploadIcon } from "@navikt/aksel-icons";
import { BodyShort, Button, FileUpload, Heading, VStack } from "@navikt/ds-react";
import { TILLATTE_FILTYPER } from "~/saker/filer/fil-type-utils";

type Props = {
  filer: File[];
  setFiler: (updater: (existing: File[]) => File[]) => void;
  /** Flytting fra Access: knapp for filene fra S-området i stedet for valgfri dropzone. */
  fraSOmråde?: boolean;
};

export function Saksvedlegg({ filer, setFiler, fraSOmråde = false }: Props) {
  return (
    <VStack gap="space-12" className="max-w-2xl">
      {fraSOmråde ? (
        <VStack gap="space-4" align="start">
          <Heading level="2" size="small">
            Filer fra S-området
          </Heading>
          <BodyShort size="small">Last opp alle filer fra S-området som gjelder saken</BodyShort>
          <FileUpload.Trigger
            accept={TILLATTE_FILTYPER}
            onSelect={(_, partitioned) =>
              setFiler((eksisterende) => [...eksisterende, ...partitioned.accepted])
            }
          >
            <Button type="button" icon={<UploadIcon aria-hidden />}>
              Last opp filer fra S:
            </Button>
          </FileUpload.Trigger>
        </VStack>
      ) : (
        <FileUpload.Dropzone
          label="Last opp dokumenter"
          description="Legg ved filer som dokumenterer saken. Maks 50 MB per fil."
          accept={TILLATTE_FILTYPER}
          onSelect={(_, partitioned) =>
            setFiler((eksisterende) => [...eksisterende, ...partitioned.accepted])
          }
        />
      )}
      {filer.length > 0 && (
        <VStack gap="space-4" as="ul" aria-label="Opplastede filer">
          {filer.map((fil, indeks) => (
            <FileUpload.Item
              key={`${fil.name}-${indeks}`}
              as="li"
              file={fil}
              button={{
                action: "delete",
                onClick: () =>
                  setFiler((eksisterende) => eksisterende.filter((_, i) => i !== indeks)),
              }}
            />
          ))}
        </VStack>
      )}
    </VStack>
  );
}
