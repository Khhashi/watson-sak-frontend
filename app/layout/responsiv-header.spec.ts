import { expect, test } from "@playwright/test";

test("holder toppfeltet innenfor skjermen på mobil", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  for (const width of [320, 375, 390]) {
    await page.setViewportSize({ width, height: 844 });

    const toppfelt = page.locator(".aksel-internalheader");
    const bredder = await toppfelt.evaluate((element) => ({
      innhold: element.clientWidth,
      rullebredde: element.scrollWidth,
    }));

    expect(
      bredder.rullebredde,
      `Toppfeltet skal ikke stikke utenfor skjermen ved ${width} px`,
    ).toBeLessThanOrEqual(bredder.innhold);
    await expect(page.getByText("mock", { exact: true })).toBeVisible();
    await expect(page.getByRole("search", { name: "Hurtigsøk" })).toBeVisible();
    await expect(page.getByRole("searchbox", { name: "Søk i saker" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Varsler/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Systemer og oppslagsverk" })).toBeVisible();
  }

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.getByText("local-mock")).toBeVisible();
  await expect(page.getByText("Bjarte Byråkratsen")).toBeVisible();
});
