import { createContext, useContext } from "react";

/**
 * CSP-nonce for skriptelementer. Settes kun på serveren (i `entry.server.tsx`).
 * I nettleseren er verdien `""`: nettleseren skjuler nonce-attributtet etter innlasting
 * (`getAttribute("nonce")` gir `""`), så tom streng gir lik verdi ved hydrering og ingen
 * hydreringsadvarsel. Skriptene er allerede kjørt når klienten tar over.
 */
const NonceContext = createContext<string>("");

export const NonceProvider = NonceContext.Provider;

export function useNonce() {
  return useContext(NonceContext);
}
