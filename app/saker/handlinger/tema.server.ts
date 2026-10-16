import { data } from "react-router";
import { erTema, type Tema } from "./tema";

/** Leser tema fra skjemaet og kaster 400 hvis det mangler eller ikke er KTR/KTA. */
export function hentTema(formData: FormData): Tema {
  const verdi = formData.get("tema");
  if (!erTema(verdi)) {
    throw data("Velg tema", { status: 400 });
  }
  return verdi;
}
