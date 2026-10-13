import type { InnloggetBruker } from "~/auth/innlogget-bruker.server";
import { hentAlleSaker } from "~/saker/mock-alle-saker.server";
import { lagMockOyeblikksbilde } from "~/saker/mock-oppsummering.server";
import { mockSaksbehandlerDetaljer } from "~/saker/mock-saksbehandlere.server";
import { getSaksenhet } from "~/saker/selectors";
import type { KontrollsakResponse } from "~/saker/types.backend";
import {
  LEDERSTATISTIKK_STEG,
  type LederAnsattStatistikk,
  type LederEnhetValg,
  type LederStatistikk,
  type LederStatus,
} from "./types";

const STATUSER: LederStatus[] = [
  "UTEN_STATUS",
  "AKTIV",
  "VENTER_PA_INFORMASJON",
  "VENTER_PA_VEDTAK",
  "VENTER_PA_RESULTAT",
  "PAAKLAGET",
  "I_BERO",
];

/** Ekstra enheter lokale mock-ledere leder i tillegg til egen enhet. */
const MOCK_EKSTRA_LEDEDE_ENHETER: Record<string, LederEnhetValg[]> = {
  L900008: [{ id: "tipsmottak", navn: "Tipsmottak" }],
};

/** Enhetene en mock-leder kan velge mellom på forsiden, med egen enhet først. */
export function mockLedetEnheter(innloggetBruker: InnloggetBruker): LederEnhetValg[] {
  const egen = { id: innloggetBruker.enhetId ?? "", navn: innloggetBruker.enhet };
  return [egen, ...(MOCK_EKSTRA_LEDEDE_ENHETER[innloggetBruker.navIdent] ?? [])];
}

/** Lager lederstatistikk fra den muterbare mock-store-en med samme kontrakt som backend. */
export function lagMockLederStatistikk(
  request: Request,
  enhetId: string,
  enhetNavn: string,
  iDag: Date = new Date(),
): LederStatistikk {
  const saker = hentAlleSaker(request).filter(
    (sak) => getSaksenhet(sak) === enhetId && sak.steg !== "AVSLUTTET",
  );
  const grensedato = trekkFraDager(datoIOslo(iDag), 30);
  const erOverFrist = (sak: KontrollsakResponse) =>
    sak.oppdatert !== null && datoIOslo(new Date(sak.oppdatert)) <= grensedato;

  const perSteg = Object.fromEntries(
    LEDERSTATISTIKK_STEG.map((steg) => [steg, saker.filter((sak) => sak.steg === steg).length]),
  ) as LederStatistikk["enhet"]["perSteg"];
  const perStatus = Object.fromEntries(
    STATUSER.map((status) => [
      status,
      saker.filter((sak) => (sak.status ?? "UTEN_STATUS") === status).length,
    ]),
  ) as Record<LederStatus, number>;

  const ansatte: LederAnsattStatistikk[] = mockSaksbehandlerDetaljer
    .filter((ansatt) => ansatt.enhet === enhetId)
    .map((ansatt) => {
      const sakerForAnsatt = saker.filter(
        (sak) => sak.saksbehandlere.eier?.navIdent === ansatt.navIdent,
      );
      return {
        navn: ansatt.navn,
        navIdent: ansatt.navIdent,
        totaltAntallIkkeAvsluttede: sakerForAnsatt.length,
        antallOverFrist: sakerForAnsatt.filter(erOverFrist).length,
      };
    })
    .sort((a, b) => a.navn.localeCompare(b.navn, "nb"));

  const ufordelte = saker.filter((sak) => !sak.saksbehandlere.eier);

  return {
    enhetId,
    enhetNavn,
    ledetEnheter: [{ id: enhetId, navn: enhetNavn }],
    enhet: {
      totaltAntallIkkeAvsluttede: saker.length,
      antallOverFrist: saker.filter(erOverFrist).length,
      perSteg,
      perStatus,
      antallUfordelte: ufordelte.length,
      oyeblikksbilde: lagMockOyeblikksbilde(saker),
    },
    ansatte: {
      tilgjengelig: true,
      liste: ansatte,
      ufordelt: {
        totaltAntallIkkeAvsluttede: ufordelte.length,
        antallOverFrist: ufordelte.filter(erOverFrist).length,
      },
    },
  };
}

function datoIOslo(dato: Date): string {
  const deler = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Oslo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(dato);
  const verdi = (type: Intl.DateTimeFormatPartTypes) =>
    deler.find((del) => del.type === type)?.value ?? "";
  return `${verdi("year")}-${verdi("month")}-${verdi("day")}`;
}

function trekkFraDager(dato: string, antallDager: number): string {
  const [år, måned, dag] = dato.split("-").map(Number);
  return new Date(Date.UTC(år, måned - 1, dag - antallDager)).toISOString().slice(0, 10);
}
