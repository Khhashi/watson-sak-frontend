import type { KontrollsakResponse, KontrollsakSaksbehandler } from "~/saker/types.backend";

/*
 * Speiler `SaksfordelingService` i watson-admin-api. Backend håndhever reglene,
 * frontend bruker dem bare til å vise og skjule handlinger. Endres de, må begge endres.
 *
 * - Fristille, overføre og videresende krever ansvarlig eller leder for sakens enhet.
 * - Å gi saken til noen i en annen enhet krever også leder for mottakerens enhet.
 */

/** Innlogget er leder for enheten saken ligger på. Backend regner med underenheter. */
function erLederForSakensEnhet(sak: KontrollsakResponse): boolean {
  return sak.tilgang?.erLederForSakensEnhet ?? false;
}

/** Ansvarlig eller leder for sakens enhet kan fristille, overføre og videresende saken. */
export function kanFordeleSak(sak: KontrollsakResponse, erEier: boolean): boolean {
  return erEier || erLederForSakensEnhet(sak);
}

/** Mottakere innlogget kan overføre saken til: samme enhet som saken, eller en enhet innlogget leder. */
export function kanOverføreTil(
  sak: KontrollsakResponse,
  saksbehandler: KontrollsakSaksbehandler,
): boolean {
  const mottakerEnhet = saksbehandler.kontrollEnhetId;
  if (!mottakerEnhet || mottakerEnhet === sak.enhet) return true;
  return sak.tilgang?.ledetEnheter.includes(mottakerEnhet) ?? false;
}

/** Mottakere innlogget kan tildele en ufordelt sak til. Tildeling til andre krever leder for mottakerens enhet. */
export function kanTildeleTil(
  sak: KontrollsakResponse,
  saksbehandler: KontrollsakSaksbehandler,
): boolean {
  const mottakerEnhet = saksbehandler.kontrollEnhetId;
  if (!mottakerEnhet) return false;
  return sak.tilgang?.ledetEnheter.includes(mottakerEnhet) ?? false;
}
