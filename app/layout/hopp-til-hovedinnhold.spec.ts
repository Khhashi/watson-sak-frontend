import { expect, test } from "@playwright/test";

import { resetMockData } from "~/test/reset-mock-data";

test.describe("Hopp til hovedinnhold", () => {
  test.beforeEach(async ({ page }) => {
    await resetMockData(page);
    await page.goto("/", { waitUntil: "networkidle" });
  });

  test("er første tastaturstopp og flytter fokus til hovedinnholdet", async ({ page }) => {
    await page.keyboard.press("Tab");

    const lenke = page.getByRole("link", { name: "Hopp til hovedinnhold" });
    await expect(lenke).toBeFocused();
    await expect(lenke).toBeVisible();

    await page.keyboard.press("Enter");

    await expect(page.locator("#maincontent")).toBeFocused();
  });
});
