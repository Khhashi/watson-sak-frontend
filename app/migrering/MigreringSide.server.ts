import { data, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { hentInnloggetBruker } from "~/auth/innlogget-bruker.server";
import { erUtloggetFeil } from "~/auth/session-utløpt.server";
import { env, skalBrukeMockdata } from "~/config/env.server";
import { hentAlleSaker } from "~/saker/mock-alle-saker.server";
import { hentMockState } from "~/testing/mock-store/session.server";
import {
  hentMockAnsattKandidater,
  hentMockMigreringKandidater,
  MOCK_MIGRERING_ANSATTE,
} from "./mock-data.server";
import {
  hentMigreringsAnsatte,
  hentMigreringsliste,
  tildelMigreringskandidat,
  type Migreringsfilter,
  type Migreringsvisning,
} from "./api.server";
import { logger } from "~/logging/logging";
import { migreringErÅpen } from "./miljo";
import {
  hentMigreringsstatus,
  MIGRERING_SIDESTORRELSE,
  MIGRERINGSSTATUSER,
  type MigreringAnsatt,
  type MigreringFilter,
  type MigreringKandidat,
  type MigreringLister,
  type MigreringSide,
} from "./types";

/**
 * Kobler kandidatene mot faktisk opprettede mock-saker: en kandidat er
 * «overført til Watson» når det finnes en sak i mock-lageret med samme
 * (legacyKilde, legacyPid) — uansett om det skjedde i denne økten (via
 * migreringslisten sitt «Opprett sak») eller var forhåndsdefinert i
 * mock-dataene.
 */
function merkAlleredeOverforte(
  request: Request,
  kandidater: MigreringKandidat[],
): MigreringKandidat[] {
  const saker = hentAlleSaker(request);

  return kandidater.map((k) => {
    const treff = saker.find(
      (sak) => sak.legacyKilde === k.legacyKilde && sak.legacyPid === k.legacyPid,
    );
    if (!treff) {
      return k;
    }
    return { ...k, alleredeMigrertTilKontrollsakId: treff.id };
  });
}

const TOM_SIDE: MigreringSide = { kandidater: [], side: 1, totalSider: 0, totalAntall: 0 };

/** Sidenummer fra URL-en. Ugyldige verdier gir side 1. */
function lesSide(url: URL, navn: string): number {
  const verdi = url.searchParams.get(navn) ?? "";
  if (!/^\d+$/.test(verdi)) return 1;
  const side = Number(verdi);
  return Number.isSafeInteger(side) && side >= 1 ? side : 1;
}

const IDENT_MØNSTER = /^[A-Za-z0-9æøåÆØÅ_-]{1,20}$/;

/** Filtre fra URL-en. Ukjente verdier ignoreres, så en feil lenke aldri gir en feilside. */
export function lesFilter(url: URL): MigreringFilter {
  const status = MIGRERINGSSTATUSER.filter((kandidat) =>
    url.searchParams.getAll("status").includes(kandidat),
  );
  const enhet = url.searchParams.get("enhet") ?? "";
  const ansvarlig = url.searchParams.get("ansvarlig") ?? "";
  return {
    status,
    enhet: IDENT_MØNSTER.test(enhet) ? enhet : null,
    ansvarlig: IDENT_MØNSTER.test(ansvarlig) ? ansvarlig : null,
  };
}

/** Henter én side. Hvis siden er forbi siste side (for eksempel etter at saker er flyttet), vises siste side. */
async function hentListe(
  request: Request,
  visning: Migreringsvisning,
  side: number,
  filter: Migreringsfilter,
): Promise<{ side: MigreringSide; utilgjengelig: boolean }> {
  try {
    let liste = await hentMigreringsliste(request, visning, side, MIGRERING_SIDESTORRELSE, filter);
    if (liste.totalSider > 0 && side > liste.totalSider) {
      liste = await hentMigreringsliste(
        request,
        visning,
        liste.totalSider,
        MIGRERING_SIDESTORRELSE,
        filter,
      );
    }
    return {
      side: {
        kandidater: liste.kandidater,
        side: liste.side,
        totalSider: liste.totalSider,
        totalAntall: liste.totalAntall,
      },
      utilgjengelig: liste.utilgjengelig,
    };
  } catch (feil) {
    // Utløpt sesjon (401) skal bevares. Alle andre feil gir tom liste og en kort feilmelding.
    if (erUtloggetFeil(feil)) throw feil;
    logger.error("Kunne ikke hente migreringsliste, viser tom liste", { visning });
    return { side: TOM_SIDE, utilgjengelig: true };
  }
}

/** Deler en liste i sider (for mock-data, der backend ikke paginerer). */
function sideAv(kandidater: MigreringKandidat[], side: number): MigreringSide {
  const totalSider = Math.ceil(kandidater.length / MIGRERING_SIDESTORRELSE);
  const aktiv = Math.min(side, Math.max(1, totalSider));
  const fra = (aktiv - 1) * MIGRERING_SIDESTORRELSE;
  return {
    kandidater: kandidater.slice(fra, fra + MIGRERING_SIDESTORRELSE),
    side: aktiv,
    totalSider,
    totalAntall: kandidater.length,
  };
}

async function hentAnsatteValg(request: Request): Promise<MigreringAnsatt[] | null> {
  try {
    return await hentMigreringsAnsatte(request);
  } catch (feil) {
    if (erUtloggetFeil(feil)) throw feil;
    logger.error("Kunne ikke hente ansatte til filter og tildeling");
    return null;
  }
}

function medFilter(kandidater: MigreringKandidat[], filter: MigreringFilter): MigreringKandidat[] {
  return kandidater.filter(
    (k) =>
      (filter.status.length === 0 || filter.status.includes(hentMigreringsstatus(k))) &&
      (!filter.enhet || k.enhet === filter.enhet) &&
      (!filter.ansvarlig || k.ansvar.navIdent === filter.ansvarlig),
  );
}

export async function loader({ request }: LoaderFunctionArgs): Promise<MigreringLister> {
  const url = new URL(request.url);
  const side = lesSide(url, "side");
  const ansatteSide = lesSide(url, "ansatteSide");
  const filter = lesFilter(url);
  const backendFilter: Migreringsfilter = filter;

  // `prod` er stengt til importen er godkjent. `local-backend` og `dev` kaller det beskyttede
  // migrerings-API-et med brukertoken. `local-mock` og `demo` bruker syntetiske eksempler (se under).
  if (!skalBrukeMockdata) {
    if (!migreringErÅpen(env.ENVIRONMENT)) {
      throw new Response("Migreringslisten er ikke tilgjengelig", { status: 404 });
    }
    const bruker = await hentInnloggetBruker({ request });
    // Uavhengige, potensielt trege kall: hent parallelt så svartiden ikke blir summen.
    const [mine, ansatte, ansatteValg] = await Promise.all([
      hentListe(request, "MINE", side, { status: filter.status }),
      bruker.erLeder
        ? hentListe(request, "ANSATTE", ansatteSide, backendFilter)
        : Promise.resolve({ side: TOM_SIDE, utilgjengelig: false }),
      bruker.erLeder ? hentAnsatteValg(request) : Promise.resolve([]),
    ]);
    return {
      mine: mine.side,
      ansatte: ansatte.side,
      ansatteValg: ansatteValg ?? [],
      filter,
      erLeder: bruker.erLeder,
      utilgjengelig: mine.utilgjengelig || ansatte.utilgjengelig || ansatteValg === null,
    };
  }

  const bruker = await hentInnloggetBruker({ request });
  const kandidater = merkAlleredeOverforte(request, hentMockMigreringKandidater(bruker.navIdent));
  const mine = medFilter(
    kandidater.filter(
      (k) => k.ansvar.type === "BEKREFTET" && k.ansvar.navIdent === bruker.navIdent,
    ),
    { status: filter.status, enhet: null, ansvarlig: null },
  );
  // Syntetiske ansatte vises bare for ledere, slik at saksbehandlere ikke ser andres saker.
  const ansatte = bruker.erLeder
    ? medFilter(hentMockAnsattKandidater(hentMockState(request).migreringTildelinger), filter)
    : [];

  return {
    mine: sideAv(mine, side),
    ansatte: sideAv(ansatte, ansatteSide),
    ansatteValg: bruker.erLeder ? MOCK_MIGRERING_ANSATTE : [],
    filter,
    erLeder: bruker.erLeder,
    utilgjengelig: false,
  };
}

const KANDIDAT_ID_MØNSTER = /^(UTREDNING|SV|NKA_DAGPENGER|NKA_AAP):\d{1,12}$/;
const NAV_IDENT_MØNSTER = /^[A-Za-z]\d{6}$/;

export type TildelingsSvar = { ok: true } | { ok: false; feil: string };

/** Lederen flytter en kandidat til en annen ansatt. Backend avgjør om lederen har rett til det. */
export async function action({ request }: ActionFunctionArgs): Promise<TildelingsSvar> {
  const bruker = await hentInnloggetBruker({ request });
  if (!bruker.erLeder) {
    throw data("Bare ledere kan endre tildeling", { status: 403 });
  }
  const skjema = await request.formData();
  const kandidatId = String(skjema.get("kandidatId") ?? "");
  const navIdent = String(skjema.get("navIdent") ?? "");
  if (!KANDIDAT_ID_MØNSTER.test(kandidatId) || !NAV_IDENT_MØNSTER.test(navIdent)) {
    throw data("Ugyldig tildeling", { status: 400 });
  }

  if (skalBrukeMockdata) {
    if (!MOCK_MIGRERING_ANSATTE.some((a) => a.navIdent === navIdent)) {
      throw data("Ugyldig tildeling", { status: 400 });
    }
    hentMockState(request).migreringTildelinger.set(kandidatId, navIdent);
    return { ok: true };
  }
  if (!migreringErÅpen(env.ENVIRONMENT)) {
    throw data("Endring av tildeling er ikke tilgjengelig", { status: 404 });
  }

  try {
    await tildelMigreringskandidat(request, kandidatId, navIdent);
    return { ok: true };
  } catch (feil) {
    if (erUtloggetFeil(feil)) throw feil;
    if (feil instanceof Response && feil.status === 409) {
      return { ok: false, feil: "Saken er allerede påbegynt og kan ikke flyttes til en annen." };
    }
    if (feil instanceof Response && (feil.status === 404 || feil.status === 403)) {
      return { ok: false, feil: "Du kan ikke tildele denne saken til den valgte saksbehandleren." };
    }
    throw feil;
  }
}
