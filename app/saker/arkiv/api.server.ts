import { apiUrl, authHeaders, håndterFeil, parseEllerKastFeil } from "~/saker/api-core.server";
import { sti } from "~/saker/sti-param.server";
import { arkivJournalposterSchema, type ArkivJournalpost } from "./typer";

/**
 * Henter journalposter for saken fra Gosys via watson-admin-api. Backend sjekker
 * tilgang, filtrerer bort skjermede journalposter og audit-logger oppslaget.
 * Mangler brukeren tilgang, returnerer backend en tom liste.
 */
export async function hentArkivJournalposter(
  token: string,
  sakId: string,
): Promise<ArkivJournalpost[]> {
  const respons = await fetch(apiUrl(sti`/api/v1/kontrollsaker/${sakId}/arkiv/journalposter`), {
    headers: authHeaders(token),
  });
  if (!respons.ok) {
    await håndterFeil(respons, "Kunne ikke hente journalposter fra Gosys", {
      forventedeStatuser: [503],
    });
  }
  return parseEllerKastFeil(
    arkivJournalposterSchema,
    await respons.json(),
    "hentArkivJournalposter",
  );
}
