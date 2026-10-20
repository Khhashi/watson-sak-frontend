import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import {
  ArchiveIcon,
  CheckmarkCircleFillIcon,
  ExclamationmarkTriangleIcon,
} from "@navikt/aksel-icons";
import {
  BodyShort,
  Button,
  Detail,
  InfoCard,
  Modal,
  Select,
  TextField,
  VStack,
} from "@navikt/ds-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { z } from "zod";
import { sporHendelse } from "~/analytics/analytics";
import { RouteConfig } from "~/routeConfig";
import type { OpprettetJournalpost } from "~/saker/arkiv/typer";
import type { DokumentNode, FilResponse } from "~/saker/filer/typer";
import { getSaksreferanse } from "~/saker/id";
import { type Tema, temaSkjema } from "../tema";
import { TemaVelger } from "../TemaVelger";
import { ArkivValgTre } from "./ArkivValgTre";
import { alleElementer, byggArkivTre } from "./arkivvalg";
import { ANNEN_DOKUMENTBESKRIVELSE, dokumentbeskrivelser } from "./dokumentbeskrivelse";

/** Det som er arkivert, slik at en oppgave kan knyttes til journalposten etterpå. */
export type ArkivertJournalpost = {
  journalpostId: string;
  tema: Tema;
  dokumentbeskrivelse: string;
  dokumentnavn: string[];
};

const arkiverSkjema = z
  .object({
    tema: temaSkjema,
    dokumentbeskrivelse: z
      .string({ error: "Velg dokumentbeskrivelse" })
      .min(1, "Velg dokumentbeskrivelse"),
    selvvalgtDokumentbeskrivelse: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.dokumentbeskrivelse === ANNEN_DOKUMENTBESKRIVELSE &&
      !data.selvvalgtDokumentbeskrivelse?.trim()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["selvvalgtDokumentbeskrivelse"],
        message: "Skriv en dokumentbeskrivelse",
      });
    }
  });

const MANGLER_VALG = "Velg minst én fil eller ett dokument";

interface ArkiverDokumenterModalProps {
  sakId: string;
  åpen: boolean;
  onClose: () => void;
  /** Kalles når journalposten er opprettet, slik at den kan vises før Gosys har den. */
  onOpprettet?: (journalpost: OpprettetJournalpost) => void;
  /** Kalles når saksbehandleren vil knytte en oppgave til journalposten. */
  onKnyttTilOppgave: (journalpost: ArkivertJournalpost) => void;
  filer: FilResponse[];
  dokumenter: DokumentNode[];
}

export function ArkiverDokumenterModal({
  sakId,
  åpen,
  onClose,
  onOpprettet,
  onKnyttTilOppgave,
  filer,
  dokumenter,
}: ArkiverDokumenterModalProps) {
  const fetcher = useFetcher();
  const [valgteNøkler, settValgteNøkler] = useState<string[]>([]);
  const [valgFeil, settValgFeil] = useState<string | undefined>();
  const [dokumentbeskrivelse, settDokumentbeskrivelse] = useState("");
  const [arkivert, settArkivert] = useState<ArkivertJournalpost | null>(null);
  const [feilmelding, settFeilmelding] = useState<string | null>(null);
  const submitPågår = useRef(false);
  const innsendt = useRef<Omit<ArkivertJournalpost, "journalpostId"> | null>(null);
  const sporingsdata = useRef<Record<string, unknown>>({});

  const tre = useMemo(() => byggArkivTre(filer, dokumenter), [filer, dokumenter]);
  const elementer = useMemo(() => alleElementer(tre), [tre]);
  const steg = arkivert ? "suksess" : "skjema";

  const [form, fields] = useForm({
    id: "arkiver-dokumenter",
    constraint: getZodConstraint(arkiverSkjema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: arkiverSkjema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    onSubmit(event, { formData }) {
      event.preventDefault();
      if (valgteNøkler.length === 0) {
        settValgFeil(MANGLER_VALG);
        return;
      }
      const valgte = elementer.filter((element) => valgteNøkler.includes(element.nøkkel));
      const beskrivelse =
        formData.get("dokumentbeskrivelse") === ANNEN_DOKUMENTBESKRIVELSE
          ? String(formData.get("selvvalgtDokumentbeskrivelse") ?? "").trim()
          : String(formData.get("dokumentbeskrivelse"));

      formData.set("handling", "opprett_journalpost");
      formData.set("tittel", beskrivelse);
      formData.delete("dokumentbeskrivelse");
      formData.delete("selvvalgtDokumentbeskrivelse");
      for (const element of valgte) {
        formData.append(element.type === "fil" ? "vedleggId" : "dokumentId", element.id);
      }

      sporingsdata.current = {
        antallFiler: valgte.filter((element) => element.type === "fil").length,
        antallDokumenter: valgte.filter((element) => element.type === "dokument").length,
        selvvalgtDokumentbeskrivelse: dokumentbeskrivelse === ANNEN_DOKUMENTBESKRIVELSE,
      };
      submitPågår.current = true;
      innsendt.current = {
        tema: formData.get("tema") as Tema,
        dokumentbeskrivelse: beskrivelse,
        dokumentnavn: valgte.map((element) => element.navn),
      };
      settFeilmelding(null);
      fetcher.submit(formData, {
        method: "post",
        action: RouteConfig.SAKER_DETALJ.replace(":sakId", getSaksreferanse(sakId)),
      });
    },
  });
  const formProps = getFormProps(form);

  function velg(nøkler: string[]) {
    settValgteNøkler(nøkler);
    if (nøkler.length > 0) settValgFeil(undefined);
  }

  function nullstill() {
    form.reset();
    settValgteNøkler([]);
    settValgFeil(undefined);
    settDokumentbeskrivelse("");
    settArkivert(null);
    settFeilmelding(null);
  }

  function handleLukk() {
    if (fetcher.state !== "idle") return;
    nullstill();
    onClose();
  }

  function handleKnyttTilOppgave() {
    if (!arkivert) return;
    sporHendelse("journalpost knytt til oppgave klikket");
    nullstill();
    onKnyttTilOppgave(arkivert);
  }

  useEffect(() => {
    if (!submitPågår.current || fetcher.state !== "idle") return;
    submitPågår.current = false;

    const data: unknown = fetcher.data;
    const ok = typeof data === "object" && data !== null && "ok" in data && data.ok === true;
    if (!ok || !innsendt.current) {
      settFeilmelding("Kunne ikke arkivere dokumentene i Gosys. Prøv igjen.");
      return;
    }
    const journalpostId =
      "journalpostId" in data && typeof data.journalpostId === "string" ? data.journalpostId : null;
    sporHendelse("journalpost opprettet", sporingsdata.current);
    onOpprettet?.({
      journalposttype: "NOTAT",
      tittel: innsendt.current.dokumentbeskrivelse,
      dokumenttitler: innsendt.current.dokumentnavn,
      journalpostId,
    });
    settArkivert({ ...innsendt.current, journalpostId: journalpostId ?? "" });
  }, [fetcher.data, fetcher.state, onOpprettet]);

  const senderInn = fetcher.state !== "idle";

  return (
    <Modal
      open={åpen}
      onClose={handleLukk}
      closeOnBackdropClick
      header={
        steg === "suksess"
          ? undefined
          : { heading: "Arkiver dokument(er) i Gosys", icon: <ArchiveIcon aria-hidden /> }
      }
      aria-label={
        steg === "suksess" ? "Dokumentene er arkivert i Gosys" : "Arkiver dokument(er) i Gosys"
      }
      width={steg === "skjema" ? "medium" : "small"}
    >
      {steg === "suksess" && <Modal.Header />}
      <fetcher.Form
        method="post"
        {...formProps}
        onSubmit={(event) => {
          if (valgteNøkler.length === 0) settValgFeil(MANGLER_VALG);
          formProps.onSubmit(event);
        }}
      >
        <Modal.Body>
          {steg === "skjema" ? (
            <VStack gap="space-24">
              <TemaVelger felt={fields.tema} />

              <VStack gap="space-16">
                <Select
                  key={fields.dokumentbeskrivelse.key}
                  name={fields.dokumentbeskrivelse.name}
                  id={fields.dokumentbeskrivelse.id}
                  label="Dokumentbeskrivelse"
                  defaultValue={fields.dokumentbeskrivelse.initialValue ?? ""}
                  error={fields.dokumentbeskrivelse.errors?.[0]}
                  onChange={(event) => settDokumentbeskrivelse(event.target.value)}
                >
                  <option value="">Velg dokumentbeskrivelse</option>
                  {dokumentbeskrivelser.map((beskrivelse) => (
                    <option key={beskrivelse} value={beskrivelse}>
                      {beskrivelse}
                    </option>
                  ))}
                </Select>
                {dokumentbeskrivelse === ANNEN_DOKUMENTBESKRIVELSE && (
                  <TextField
                    key={fields.selvvalgtDokumentbeskrivelse.key}
                    name={fields.selvvalgtDokumentbeskrivelse.name}
                    id={fields.selvvalgtDokumentbeskrivelse.id}
                    label="Selvvalgt dokumentbeskrivelse"
                    defaultValue={fields.selvvalgtDokumentbeskrivelse.initialValue}
                    error={fields.selvvalgtDokumentbeskrivelse.errors?.[0]}
                  />
                )}
              </VStack>

              {elementer.length > 0 ? (
                <ArkivValgTre tre={tre} valgte={valgteNøkler} onChange={velg} error={valgFeil} />
              ) : (
                <VStack gap="space-4">
                  <BodyShort weight="semibold">Filer og dokumenter fra saken</BodyShort>
                  <Detail textColor="subtle">Ingen filer og dokumenter å velge blant.</Detail>
                  {valgFeil && (
                    <BodyShort size="small" className="text-ax-text-danger">
                      {valgFeil}
                    </BodyShort>
                  )}
                </VStack>
              )}

              <InfoCard size="small" data-color="warning">
                <InfoCard.Header icon={<ExclamationmarkTriangleIcon aria-hidden />}>
                  <InfoCard.Title as="h3">Tilgang til dokumenter</InfoCard.Title>
                </InfoCard.Header>
                <InfoCard.Content>
                  Når du arkiverer og journalfører dokumentene i Gosys kan de ikke lenger åpnes og
                  redigeres i Watson sak.
                </InfoCard.Content>
              </InfoCard>

              {feilmelding && (
                <InfoCard size="small" data-color="danger">
                  <InfoCard.Message icon={<ExclamationmarkTriangleIcon aria-hidden />}>
                    {feilmelding}
                  </InfoCard.Message>
                </InfoCard>
              )}
            </VStack>
          ) : (
            <VStack gap="space-16" align="center" className="py-6 text-center">
              <CheckmarkCircleFillIcon
                aria-hidden
                fontSize="3rem"
                className="text-ax-bg-success-strong"
              />
              <VStack gap="space-4" align="center">
                <BodyShort weight="semibold">
                  Dokumentene er arkivert og journalført i Gosys
                </BodyShort>
                {arkivert?.journalpostId && (
                  <BodyShort textColor="subtle">
                    Du kan knytte en oppgave til de journalførte dokumentene.
                  </BodyShort>
                )}
              </VStack>
            </VStack>
          )}
        </Modal.Body>
        <Modal.Footer>
          {steg === "skjema" ? (
            <>
              <Button type="submit" variant="primary" loading={senderInn} disabled={senderInn}>
                Arkiver
              </Button>
              <Button type="button" variant="secondary" onClick={handleLukk}>
                Avbryt
              </Button>
            </>
          ) : (
            <>
              {arkivert?.journalpostId && (
                <Button type="button" variant="primary" onClick={handleKnyttTilOppgave}>
                  Knytt til oppgave
                </Button>
              )}
              <Button type="button" variant="secondary" onClick={handleLukk} autoFocus>
                Lukk
              </Button>
            </>
          )}
        </Modal.Footer>
      </fetcher.Form>
    </Modal>
  );
}
