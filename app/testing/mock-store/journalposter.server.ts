import type { Tema } from "~/saker/handlinger/tema";
import type { JournalpostReferanse } from "~/saker/filer/typer";
import type { MockState } from "./session.server";

/** Journalpost i mock-storen. Tema lagres så arkivvisningen kan vise det som ble valgt. */
export type MockJournalpost = JournalpostReferanse & { tema?: Tema };

export function hentJournalposterForSak(state: MockState, sakId: string): MockJournalpost[] {
  return state.journalposter.get(sakId) ?? [];
}

export function leggTilJournalpost(state: MockState, sakId: string, journalpost: MockJournalpost) {
  state.journalposter.set(sakId, [...hentJournalposterForSak(state, sakId), journalpost]);
}
