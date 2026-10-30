import { expect, test } from "@playwright/test";

test("viser en smal hovedmeny på mobil og full meny på større skjermer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });

  const hovedmeny = page.getByRole("navigation", { name: "Hovedmeny" });
  await expect(hovedmeny).toBeVisible();
  const mineSakerLenke = page.getByRole("link", { name: "Mine saker" });
  await expect(mineSakerLenke).toBeVisible();
  await expect(mineSakerLenke.getByText("Mine saker")).toHaveCSS("position", "static");
  await expect(
    page.getByRole("link", { name: "Ufordelte saker" }).getByText("Ufordelte saker"),
  ).toHaveCSS("white-space", "normal");
  await expect(hovedmeny).toHaveCSS("width", "96px");

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(hovedmeny).toHaveCSS("width", "224px");
});
