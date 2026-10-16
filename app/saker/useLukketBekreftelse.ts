import { useCallback, useEffect, useState } from "react";

const nøkkel = (sakId: string | number) => `migrering-bekreftelse-lukket:${sakId}`;

function lesLukket(sakId: string | number): boolean {
  try {
    return window.localStorage.getItem(nøkkel(sakId)) === "1";
  } catch {
    return false;
  }
}

/**
 * Husker per sak i nettleseren at brukeren har lukket «Saken er ferdig flyttet».
 * Verdien leses først etter hydrering, så server og klient rendrer likt. Til da er `lukket` null.
 */
export function useLukketBekreftelse(sakId: string | number) {
  const [lukket, setLukket] = useState<boolean | null>(null);

  useEffect(() => {
    setLukket(lesLukket(sakId));
  }, [sakId]);

  const lukk = useCallback(() => {
    setLukket(true);
    try {
      window.localStorage.setItem(nøkkel(sakId), "1");
    } catch {
      // Lagring kan være blokkert. Bekreftelsen er da lukket bare til siden lastes på nytt.
    }
  }, [sakId]);

  return { vis: lukket === false, lukk };
}
