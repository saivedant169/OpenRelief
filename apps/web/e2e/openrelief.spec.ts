import { expect, test } from "@playwright/test";

test("letter review produces checklist and evidence packet", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Letter Review" })).toBeVisible();
  await expect(page.getByText("Local only")).toBeVisible();

  await page.getByRole("button", { name: /analyze letter/i }).click();

  await expect(page.getByText("Claim denial")).toBeVisible();
  await expect(page.getByText("Request human review")).toBeVisible();
  await expect(page.getByText("Collect proof of occupancy")).toBeVisible();
  await expect(page.getByText("Evidence packet outline")).toBeVisible();
  await expect(page.getByText("Appeal FEMA's Decision")).toBeVisible();
});

