import { expect, type Page } from "@playwright/test";

export async function ventPåHydrering(page: Page) {
  await expect(page.locator("html")).toHaveAttribute("data-hydrert", "true");
}
