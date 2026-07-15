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
  await expect(page.getByRole("link", { name: "Appeal FEMA's Decision" })).toBeVisible();
});

test("immediate danger guidance appears before paperwork", async ({ page }) => {
  await page.goto("/");

  await page
    .getByLabel("Immediate needs and risks")
    .fill("There is fire outside right now and I am in immediate danger.");

  const emergencyAlert = page.getByRole("alert", { name: "Immediate danger guidance" });
  await expect(emergencyAlert).toContainText("contact local emergency services now");
  await expect(page.getByText(/hotline|911|988/i)).toHaveCount(0);

  await page.getByRole("button", { name: /analyze letter/i }).click();

  await expect(page.getByText("immediate_danger")).toBeVisible();
  const firstChecklistItem = page.locator(".checklist li").first();
  await expect(firstChecklistItem).toContainText("Request human review");
  await expect(firstChecklistItem).toContainText("Immediate danger should be handled before paperwork");
});

test("app shell reloads offline after service worker cache", async ({ context, page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Letter Review" })).toBeVisible();

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Letter Review" })).toBeVisible();

  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "Letter Review" })).toBeVisible();
  await page.getByRole("button", { name: /analyze letter/i }).click();
  await expect(page.getByText("Claim denial")).toBeVisible();

  await context.setOffline(false);
});

test("mobile project supports 360px viewport without horizontal overflow", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile-only viewport contract");

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Letter Review" })).toBeVisible();

  expect(page.viewportSize()?.width).toBe(360);
  const layoutWidth = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    viewport: window.innerWidth
  }));

  expect(layoutWidth.body).toBeLessThanOrEqual(layoutWidth.viewport);
});
