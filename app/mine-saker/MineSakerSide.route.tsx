import { useLoaderData } from "react-router";
import { getBackendOboToken } from "~/auth/access-token";
import { hentInnloggetBruker } from "~/auth/innlogget-bruker.server";
import { sorteringskolonner, type Sorteringsretning } from "~/alle-saker/saker-utils";
import { skalBrukeMockdata } from "~/config/env.server";
import { hentKontrollsaker } from "~/fordeling/api.server";
import { MiljøtilpassetTittel } from "~/layout/MiljøtilpassetTittel";
import { RouteConfig } from "~/routeConfig";
import { hentMineSaker } from "~/saker/mock-alle-saker.server";
import { formaterSteg } from "~/saker/visning";
import { ANTALL_PER_SIDE } from "~/utils/paginering";
import { hentParEllerUtilgjengelig } from "~/utils/backend-utilgjengelig.server";
import type { KontrollsakResponse, KontrollsakStatus } from "~/saker/types.backend";
import type { Route } from "./+types/MineSakerSide.route";
import { MineSakerInnhold } from "./MineSakerInnhold";
import {
  ALLE_STEG,
  ALLE_VENTESTATUSER,
  filtrerMineSaker,
  formaterVentestatus,
  parseSteg,
  parseVentestatuser,
} from "./filtre";

/** Tabellen med saker er bred, så siden ber layouten om å slippe maks-bredden
 * for å unngå unødvendig horisontal scroll på brede skjermer. */
export const handle = { bredPageBlock: true };

const STANDARD_KOLONNE = "opprettet" as const;
const STANDARD_RETNING: Sorteringsretning = "desc";
const BACKEND_SORT_FELT = {
  saksid: "id",
  opprettet: "opprettet",
  oppdatert: "oppdatert",
  status: "status",
  steg: "steg",
  kategori: "kategori",
} satisfies Partial<Record<(typeof sorteringskolonner)[number], string>>;

function parseSidenummer(verdi: string | null): number {
  const side = Number(verdi ?? "1");
  return Number.isSafeInteger(side) && side > 0 ? side : 1;
}

function parseSortering(url: URL) {
  const ønsketKolonne = url.searchParams.get("sorter");
  const kolonne =
    ønsketKolonne && Object.hasOwn(BACKEND_SORT_FELT, ønsketKolonne)
      ? (ønsketKolonne as keyof typeof BACKEND_SORT_FELT)
      : STANDARD_KOLONNE;
  const retning =
    url.searchParams.get("retning") === "asc" || url.searchParams.get("retning") === "desc"
      ? (url.searchParams.get("retning") as Sorteringsretning)
      : STANDARD_RETNING;

  return {
    sortering: `${BACKEND_SORT_FELT[kolonne]},${retning.toUpperCase()}`,
  };
}

export async function loader({ request }: Route.LoaderArgs) {
  const innloggetBruker = await hentInnloggetBruker({ request });

  const url = new URL(request.url);
  const side = parseSidenummer(url.searchParams.get("side"));
  const harFilterParams = url.searchParams.has("steg") || url.searchParams.has("status");

  const stegFilter = harFilterParams ? parseSteg(url.searchParams.getAll("steg")) : [];

  const statusFilter = harFilterParams ? parseVentestatuser(url.searchParams.getAll("status")) : [];

  // Map status-filteret til backend-parametre:
  // "INGEN" → utenStatus=true, faktiske blokkerende statuser → status[]
  const blokkerendeStatus = statusFilter.filter((v): v is KontrollsakStatus => v !== "INGEN");
  const harIngenStatus = statusFilter.length > 0 && statusFilter.includes("INGEN");

  let saker: KontrollsakResponse[];
  let sakerPaginering: { side: number; totalSider: number; totalAntall: number } | undefined;
  let deltMedSaker: KontrollsakResponse[];
  let saksdataUtilgjengelig = false;
  if (!skalBrukeMockdata) {
    const token = await getBackendOboToken(request);
    const felles = {
      token,
      page: 1,
      size: 200,
      steg: stegFilter.length > 0 ? stegFilter : undefined,
      status: blokkerendeStatus.length > 0 ? blokkerendeStatus : undefined,
      utenStatus: harIngenStatus ? true : undefined,
    };
    const sortering = parseSortering(url);
    const resultat = await hentParEllerUtilgjengelig(
      hentKontrollsaker({
        ...felles,
        page: side,
        size: ANTALL_PER_SIDE,
        ansvarlig: "MEG",
        sortering: sortering.sortering,
      }),
      hentKontrollsaker({ ...felles, tilknyttet: "MEG" }),
    );
    if (resultat.saksdataUtilgjengelig) {
      saker = [];
      deltMedSaker = [];
      saksdataUtilgjengelig = true;
    } else {
      const [mineSakerResultat, tilknyttedeSakerResultat] = resultat.resultater;
      saker = mineSakerResultat.items;
      sakerPaginering = {
        side: mineSakerResultat.page,
        totalSider: mineSakerResultat.totalPages,
        totalAntall: mineSakerResultat.totalItems,
      };
      deltMedSaker = tilknyttedeSakerResultat.items.filter(
        (sak) => sak.saksbehandlere?.eier?.navIdent !== innloggetBruker.navIdent,
      );
    }
  } else {
    const alleSaker = hentMineSaker(request, innloggetBruker.navIdent, innloggetBruker.name);
    saker = filtrerMineSaker(alleSaker, stegFilter, statusFilter);
    deltMedSaker = [];
  }

  return {
    saker,
    sakerPaginering,
    deltMedSaker,
    saksdataUtilgjengelig,
    filterAlternativer: {
      steg: [...ALLE_STEG, "AVSLUTTET" as const].map((s) => ({
        verdi: s,
        etikett: formaterSteg(s),
      })),
      status: ALLE_VENTESTATUSER.map((v) => ({ verdi: v, etikett: formaterVentestatus(v) })),
    },
    aktivtFilter: {
      steg: stegFilter,
      status: statusFilter,
    },
  };
}

export default function MineSakerSide() {
  const {
    saker,
    sakerPaginering,
    deltMedSaker,
    filterAlternativer,
    aktivtFilter,
    saksdataUtilgjengelig,
  } = useLoaderData<typeof loader>();

  return (
    <>
      <MiljøtilpassetTittel>Mine saker – Watson Sak</MiljøtilpassetTittel>
      <MineSakerInnhold
        saker={saker}
        sakerPaginering={sakerPaginering}
        deltMedSaker={deltMedSaker}
        saksdataUtilgjengelig={saksdataUtilgjengelig}
        detaljSti={RouteConfig.SAKER_DETALJ.replace("/:sakId", "")}
        filterAlternativer={filterAlternativer}
        aktivtFilter={aktivtFilter}
      />
    </>
  );
}
