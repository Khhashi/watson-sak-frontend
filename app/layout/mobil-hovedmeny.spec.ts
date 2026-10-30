import { expect, test } from "@playwright/test";

test("viser en smal hovedmeny på mobil og full meny på større skjermer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });

  const hovedmeny = page.getByRole("navigation", { name: "Hovedmeny" });
  await expect(hovedmeny).toBeVisible();
  await expect(page.getByRole("link", { name: "Mine saker" })).toBeVisible();
  await expect(hovedmeny).toHaveCSS("width", "64px");

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(hovedmeny).toHaveCSS("width", "224px");
});
