import { useLoaderData } from "react-router";
import { MiljøtilpassetTittel } from "~/layout/MiljøtilpassetTittel";
import { MigreringInnhold } from "./MigreringInnhold";
import { action, loader } from "./MigreringSide.server";

export { action, loader };
export const handle = { bredPageBlock: true };

export default function MigreringSide() {
  const lister = useLoaderData<typeof loader>();

  return (
    <>
      <MiljøtilpassetTittel>Flytt fra Access – Watson Sak</MiljøtilpassetTittel>
      <MigreringInnhold lister={lister} />
    </>
  );
}
