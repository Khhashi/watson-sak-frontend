import { act, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockKodeverk } from "~/testing/mock-store/kodeverk.server";
import OpprettSakSide from "./RegistrerSakSide.route";

const state = vi.hoisted(() => ({
  miljø: "local-backend",
  legacyPid: null as string | null,
  legacyKilde: null as string | null,
  featureFlags: {} as Record<string, boolean>,
  kanOppretteSak: true,
}));
vi.mock("~/miljø/useMiljø", () => ({ useMiljø: () => state.miljø }));
vi.mock("~/kodeverk/useKodeverk", () => ({ useKodeverk: () => mockKodeverk }));
vi.mock("~/feature-toggling/useFeatureFlagg", () => ({
  useEnkeltFeatureFlagg: (flagg: string) => state.featureFlags[flagg] ?? false,
}));
vi.mock("./RegistrerSakSide.server", () => ({
  loader: () => ({ fnr: null, legacyPid: null, legacyKilde: null }),
  action: vi.fn(),
}));
vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return {
    ...actual,
    useFetcher: () => ({
      Form: actual.Form,
      state: "idle",
      data: {
        person: {
          navn: "Testperson",
          personnummer: "11111111111",
          alder: 42,
          adresseskjermet: false,
          kanOppretteSak: state.kanOppretteSak,
        },
        eksisterendeSaker: [],
      },
      submit: vi.fn(),
    }),
  };
});

function renderSide() {
  const router = createMemoryRouter(
    [
      {
        path: "/registrer-sak",
        Component: OpprettSakSide,
        loader: () => ({ fnr: null, legacyPid: state.legacyPid, legacyKilde: state.legacyKilde }),
      },
    ],
    { initialEntries: ["/registrer-sak"] },
  );
  return render(<RouterProvider router={router} />);
}

describe("Notat i Opprett sak", () => {
  beforeEach(() => {
    state.miljø = "local-backend";
    state.legacyPid = null;
    state.legacyKilde = null;
    state.featureFlags = {};
    state.kanOppretteSak = true;
  });

  it.each(["local-mock", "local-backend"])(
    "viser et redigerbart Notat-felt for migreringssaker i %s",
    async (miljø) => {
      state.miljø = miljø;
      state.legacyPid = "100245";
      state.legacyKilde = "UTREDNING";
      renderSide();
      const notat = await screen.findByRole("textbox", { name: "Notat – informasjon fra Access" });
      expect((notat as HTMLTextAreaElement).disabled).toBe(false);
      expect((notat as HTMLTextAreaElement).name).toBe("notat");
    },
  );

  it("viser flytt-fra-Access-oppsett med S:-opplasting først for migreringssaker", async () => {
    state.legacyPid = "100245";
    state.legacyKilde = "UTREDNING";
    renderSide();

    expect(
      await screen.findByRole("heading", { level: 1, name: "Flytt fra Access" }),
    ).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Filer fra S-området" })).not.toBeNull();
    expect(screen.getByText("Last opp filer fra S:")).not.toBeNull();
    expect(screen.queryByText("Last opp dokumenter (valgfritt)")).toBeNull();
  });

  it("beholder vanlig opprett-sak-oppsett uten migrering", async () => {
    renderSide();

    expect(await screen.findByRole("heading", { level: 1, name: "Opprett sak" })).not.toBeNull();
    expect(screen.queryByRole("heading", { name: "Filer fra S-området" })).toBeNull();
    expect(screen.getByText("Last opp dokumenter (valgfritt)")).not.toBeNull();
  });

  it("viser ikke Notat for vanlige saker", async () => {
    renderSide();
    await screen.findByRole("heading", { name: "Grunnleggende saksinformasjon" });
    expect(screen.queryByRole("textbox", { name: "Notat – informasjon fra Access" })).toBeNull();
  });

  it.each([
    { legacyPid: "100245", legacyKilde: null },
    { legacyPid: null, legacyKilde: "UTREDNING" },
  ])(
    "viser ikke Notat når migreringsnøkkelen er ufullstendig",
    async ({ legacyPid, legacyKilde }) => {
      state.legacyPid = legacyPid;
      state.legacyKilde = legacyKilde;
      renderSide();
      await screen.findByRole("heading", { name: "Grunnleggende saksinformasjon" });
      expect(screen.queryByRole("textbox", { name: "Notat – informasjon fra Access" })).toBeNull();
    },
  );

  it("beholder Notat, PID og kobling når loaderen revalideres uten cookie", async () => {
    // Cookien fra migreringslisten er engangs. Person-oppslaget revaliderer loaderen, og da kommer
    // loaderen tilbake uten migreringsnøkkel. Notat-feltet skal likevel bli stående.
    let kall = 0;
    const router = createMemoryRouter(
      [
        {
          path: "/registrer-sak",
          Component: OpprettSakSide,
          loader: () => {
            kall += 1;
            return kall === 1
              ? { fnr: null, legacyPid: "100245", legacyKilde: "UTREDNING" }
              : { fnr: null, legacyPid: null, legacyKilde: null };
          },
        },
      ],
      { initialEntries: ["/registrer-sak"] },
    );
    const { container } = render(<RouterProvider router={router} />);
    await screen.findByRole("textbox", { name: "Notat – informasjon fra Access" });

    await act(async () => {
      await router.revalidate();
    });

    expect(kall).toBeGreaterThan(1);
    expect(screen.getByRole("textbox", { name: "Notat – informasjon fra Access" })).not.toBeNull();
    expect(screen.getByText(/PID: 100245/)).not.toBeNull();
    expect(container.querySelector('input[name="legacyPid"]')).not.toBeNull();
    expect(container.querySelector('input[name="legacyKilde"]')).not.toBeNull();
  });
});

async function velgISelect(select: HTMLSelectElement, verdi: string) {
  // Som i nettleseren: input-eventet kommer før change, med mikrooppgaver imellom.
  await act(async () => {
    select.value = verdi;
    select.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

describe("Nedtrekksfelt i Opprett sak", () => {
  beforeEach(() => {
    state.miljø = "local-backend";
    state.legacyPid = null;
    state.legacyKilde = null;
    state.featureFlags = {};
  });

  it("lar saksbehandler velge verdier etter en valideringsfeil", async () => {
    renderSide();
    await screen.findByRole("heading", { name: "Grunnleggende saksinformasjon" });

    await act(async () => {
      screen.getByRole("button", { name: "Opprett sak" }).click();
    });
    await screen.findByText("Du må rette disse feilene før du kan gå videre");

    const kategori = screen.getByRole("combobox", {
      name: "Kategori (må fylles ut)",
    }) as HTMLSelectElement;
    const kilde = screen.getByRole("combobox", {
      name: "Kilde (må fylles ut)",
    }) as HTMLSelectElement;
    const enhet = screen.getByRole("combobox", {
      name: "Enhet (må fylles ut)",
    }) as HTMLSelectElement;

    const [valgtKategori] = mockKodeverk.kategorier;
    const [valgtKilde] = mockKodeverk.kilder;
    const [valgtEnhet] = mockKodeverk.enheter;
    if (!valgtKategori || !valgtKilde || !valgtEnhet) throw new Error("Mangler kodeverk");

    await velgISelect(kategori, valgtKategori.kode);
    expect(
      (screen.getByRole("combobox", { name: "Misbrukstype" }) as HTMLInputElement).disabled,
    ).toBe(false);
    await velgISelect(kilde, valgtKilde.kode);
    await velgISelect(enhet, valgtEnhet.kode);

    expect(kategori.value).toBe(valgtKategori.kode);
    expect(kilde.value).toBe(valgtKilde.kode);
    expect(enhet.value).toBe(valgtEnhet.kode);
  });

  it("fyller ut nedtrekksfeltene med en tilfeldig sak", async () => {
    renderSide();
    const knapp = await screen.findByRole("button", { name: "Fyll ut en tilfeldig sak" });

    await act(async () => {
      knapp.click();
    });

    for (const navn of [
      "Kategori (må fylles ut)",
      "Kilde (må fylles ut)",
      "Enhet (må fylles ut)",
    ]) {
      const select = screen.getByRole("combobox", { name: navn }) as HTMLSelectElement;
      expect(select.value).not.toBe("");
    }
  });

  it("normaliserer kommaseparerte organisasjonsnummer i skjemaet", async () => {
    const { container } = renderSide();
    const felt = await screen.findByRole("textbox", { name: "Organisasjonsnummer" });

    fireEvent.change(felt, { target: { value: "123 456 789, 987654321" } });

    const skjulteFelt = container.querySelectorAll<HTMLInputElement>(
      'form[aria-label="Grunnleggende saksinformasjon"] input[name="arbeidsgivere"]',
    );
    expect(Array.from(skjulteFelt, (input) => input.value)).toEqual(["123456789", "987654321"]);
  });

  it.each([
    { miljø: "dev", dev: true, demo: false, synlig: true },
    { miljø: "dev", dev: false, demo: true, synlig: false },
    { miljø: "demo", dev: false, demo: true, synlig: true },
    { miljø: "demo", dev: true, demo: false, synlig: false },
  ])(
    "styrer tilfeldig sak i $miljø med riktig feature-flagg",
    async ({ miljø, dev, demo, synlig }) => {
      state.miljø = miljø;
      state.featureFlags = {
        "watson-sak-tilfeldig-sak-i-dev": dev,
        "watson-sak-tilfeldig-sak-i-demo": demo,
      };

      renderSide();
      await screen.findByRole("heading", { name: "Grunnleggende saksinformasjon" });

      expect(screen.queryByRole("button", { name: "Fyll ut en tilfeldig sak" }) !== null).toBe(
        synlig,
      );
    },
  );
});

describe("Sperret skjema i Opprett sak", () => {
  beforeEach(() => {
    state.miljø = "local-backend";
    state.legacyPid = null;
    state.legacyKilde = null;
    state.featureFlags = {};
    state.kanOppretteSak = true;
  });

  it("sperrer skjemaet når backend sier at sak ikke kan opprettes, også for person uten adresseskjerming", async () => {
    state.kanOppretteSak = false;
    renderSide();

    expect(await screen.findByText("Du kan ikke opprette sak på denne personen")).toBeDefined();
    expect(screen.queryByRole("form", { name: "Grunnleggende saksinformasjon" })).toBeNull();
  });
});
