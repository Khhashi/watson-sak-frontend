import { FaroErrorBoundary } from "@grafana/faro-react";
import { useEffect, useState } from "react";
import { Links, Meta, Scripts, ScrollRestoration } from "react-router";
import { AnalyticsTags } from "~/analytics/analytics";
import { MiljøProvider } from "~/layout/MiljøtilpassetTittel";
import { PreferencesProvider } from "~/preferanser/PreferencesContext";
import { useNonce } from "~/sikkerhet/nonce";
import { defaultPreferences, type Preferences } from "~/preferanser/PreferencesCookie";
import { ThemeProvider } from "~/tema/ThemeContext";

type HtmlRammeProps = {
  children: React.ReactNode;
  initialPreferences?: Preferences;
  umamiSiteId: string;
  sporingScriptUrl?: string | null;
  miljø?: string;
};

export function HtmlRamme({
  children,
  initialPreferences = defaultPreferences,
  umamiSiteId,
  sporingScriptUrl,
  miljø = "prod",
}: HtmlRammeProps) {
  const nonce = useNonce();
  const [hydrert, settHydrert] = useState(false);
  useEffect(() => {
    settHydrert(true);
  }, []);

  return (
    <html lang="nb-no" data-hydrert={hydrert}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" />
        <Meta />
        <Links nonce={nonce} />
        {umamiSiteId && sporingScriptUrl && (
          <AnalyticsTags sporingScriptUrl={sporingScriptUrl} sporingId={umamiSiteId} />
        )}
      </head>
      <body className="flex flex-col min-h-screen">
        <MiljøProvider miljø={miljø}>
          <FaroErrorBoundary>
            <PreferencesProvider defaultPreferences={initialPreferences}>
              <ThemeProvider>{children}</ThemeProvider>
            </PreferencesProvider>
          </FaroErrorBoundary>
        </MiljøProvider>
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}
