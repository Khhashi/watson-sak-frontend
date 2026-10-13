import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { PersonPencilIcon } from "@navikt/aksel-icons";
import { BodyShort, Button, Modal, UNSAFE_Combobox, VStack } from "@navikt/ds-react";
import { useState } from "react";
import { useFetcher } from "react-router";
import { z } from "zod";
import { RouteConfig } from "~/routeConfig";
import { getSaksreferanse } from "~/saker/id";
import type { KontrollsakSaksbehandler } from "~/saker/types.backend";

const overforSkjema = z.object({
  navIdent: z.string({ error: "Velg en saksbehandler" }).min(1, "Velg en saksbehandler"),
});

interface OverforAnsvarligModalProps {
  sakId: string;
  saksbehandlerDetaljer: KontrollsakSaksbehandler[];
  åpen: boolean;
  onClose: () => void;
}

export function OverforAnsvarligModal({
  sakId,
  saksbehandlerDetaljer,
  åpen,
  onClose,
}: OverforAnsvarligModalProps) {
  const fetcher = useFetcher();
  const saksreferanse = getSaksreferanse(sakId);
  const [valgtNavIdent, setValgtNavIdent] = useState("");

  const erSubmitting = fetcher.state !== "idle";
  const actionPath = RouteConfig.SAKER_DETALJ.replace(":sakId", saksreferanse);

  const [form, fields] = useForm({
    id: "overfor-ansvarlig",
    constraint: getZodConstraint(overforSkjema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: overforSkjema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    onSubmit(event, { formData }) {
      event.preventDefault();
      formData.set("handling", "overfor_ansvarlig");
      fetcher.submit(formData, { method: "post", action: actionPath });
      form.reset();
      setValgtNavIdent("");
      onClose();
    },
  });

  function handleClose() {
    form.reset();
    setValgtNavIdent("");
    onClose();
  }

  const valgbareSaksbehandlere = saksbehandlerDetaljer.map((saksbehandler) => ({
    value: saksbehandler.navIdent,
    label: `${saksbehandler.navn} (${saksbehandler.navIdent})`,
  }));
  const valgtSaksbehandler = valgbareSaksbehandlere.find(
    (saksbehandler) => saksbehandler.value === valgtNavIdent,
  );

  return (
    <Modal
      open={åpen}
      onClose={handleClose}
      header={{
        heading: "Endre ansvarlig saksbehandler",
        icon: <PersonPencilIcon aria-hidden />,
      }}
      width="small"
    >
      <fetcher.Form method="post" {...getFormProps(form)}>
        <Modal.Body>
          <VStack gap="space-4">
            <BodyShort>Velg ny ansvarlig saksbehandler for sak {saksreferanse}.</BodyShort>
            <input type="hidden" name={fields.navIdent.name} value={valgtNavIdent} />
            <UNSAFE_Combobox
              key={fields.navIdent.key}
              id={fields.navIdent.id}
              label="Saksbehandler"
              placeholder="Søk etter saksbehandler"
              options={valgbareSaksbehandlere}
              selectedOptions={valgtSaksbehandler ? [valgtSaksbehandler] : []}
              onToggleSelected={(navIdent, erValgt) => {
                setValgtNavIdent(erValgt ? navIdent : "");
              }}
              error={fields.navIdent.errors?.[0]}
            />
          </VStack>
        </Modal.Body>
        <Modal.Footer>
          <Button type="submit" disabled={erSubmitting}>
            Overfør sak
          </Button>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Avbryt
          </Button>
        </Modal.Footer>
      </fetcher.Form>
    </Modal>
  );
}
