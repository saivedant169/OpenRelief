import { expect, test } from "@playwright/test";

const buildPdfWithText = (text: string) => {
  const escapedText = text.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
  const content = `BT\n/F1 12 Tf\n72 720 Td\n(${escapedText}) Tj\nET`;
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    `5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = objects.map((object) => {
    const offset = pdf.length;
    pdf += object;
    return offset;
  });
  const startxref = pdf.length;
  const xrefEntries = offsets.map((offset) => `${offset.toString().padStart(10, "0")} 00000 n \n`).join("");

  return [
    pdf,
    `xref\n0 ${objects.length + 1}\n`,
    "0000000000 65535 f \n",
    xrefEntries,
    `trailer\n<< /Root 1 0 R /Size ${objects.length + 1} >>\nstartxref\n${startxref}\n%%EOF`
  ].join("");
};

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

test("uploaded sample denial letter stays editable and classifies", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Choose file").setInputFiles("examples/california-wildfire/letters/denial-occupancy-proof.txt");

  await expect(page.getByText("denial-occupancy-proof.txt")).toBeVisible();
  await expect(page.getByLabel("Extracted letter text")).toHaveValue(/proof of occupancy is missing/);

  await page.getByRole("button", { name: /analyze letter/i }).click();

  await expect(page.getByText("Claim denial")).toBeVisible();
  await expect(page.getByText("Collect proof of occupancy")).toBeVisible();
  await expect(page.getByText("Evidence packet outline")).toBeVisible();
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

  await expect(page.locator(".risk-list").getByText("Immediate danger", { exact: true })).toBeVisible();
  const firstChecklistItem = page.locator(".checklist li").first();
  await expect(firstChecklistItem).toContainText("Request human review");
  await expect(firstChecklistItem).toContainText("Immediate danger should be handled before paperwork");
});

test("source citations export and clear local data stay usable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Letter Review" })).toBeVisible();

  await page.getByRole("button", { name: /analyze letter/i }).click();

  const sourceCard = page.locator("article").filter({ has: page.getByRole("heading", { name: "Source citations" }) });
  await expect(sourceCard.getByRole("link", { name: "Appeal FEMA's Decision" })).toHaveAttribute(
    "href",
    "https://www.fema.gov/assistance/individual/after-applying/appeals"
  );
  await expect(sourceCard.getByText("https://www.fema.gov/assistance/individual/after-applying/appeals")).toBeVisible();
  await expect(sourceCard.getByText(/retrieved 2026-07-13/).first()).toBeVisible();

  await page.getByRole("button", { name: "Create packet text" }).click();
  const exportText = page.getByLabel("Export packet text");
  await expect(exportText).toContainText("Sources");
  await expect(exportText).toContainText("https://www.fema.gov/assistance/individual/after-applying/appeals");
  await expect(exportText).toContainText("retrieved 2026-07-13");

  await page.getByRole("button", { name: "Save case snapshot" }).click();
  await expect(page.getByRole("region", { name: "Local case queue" }).getByText("Saved case: Claim denial")).toBeVisible();
  expect(
    await page.evaluate(() =>
      Array.from({ length: window.localStorage.length }, (_value, index) => window.localStorage.key(index) ?? "").some(
        (key) => key.startsWith("openrelief:")
      )
    )
  ).toBe(true);

  await page.getByRole("button", { name: "Clear export local data" }).click();
  await page.getByRole("button", { name: "Confirm clear export local data" }).click();

  await expect(page.getByLabel("Extracted letter text")).toHaveValue("");
  await expect(page.getByRole("region", { name: "Local case queue" }).getByText("No saved cases")).toBeVisible();
  expect(
    await page.evaluate(() =>
      Array.from({ length: window.localStorage.length }, (_value, index) => window.localStorage.key(index) ?? "").some(
        (key) => key.startsWith("openrelief:")
      )
    )
  ).toBe(false);
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
  await expect(page.getByText("Request human review")).toBeVisible();
  await expect(page.getByText("Collect proof of occupancy")).toBeVisible();
  await expect(page.getByText("Evidence packet outline")).toBeVisible();
  await expect(page.getByRole("link", { name: "Appeal FEMA's Decision" })).toBeVisible();

  await context.setOffline(false);
});

test("PDF upload still works offline after service worker cache", async ({ context, page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Letter Review" })).toBeVisible();

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });

  await context.setOffline(true);
  await page.getByLabel("Choose file").setInputFiles({
    name: "offline-approval.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(buildPdfWithText("FEMA Notice Your application is approved for rental assistance."))
  });

  await expect(page.getByText("offline-approval.pdf")).toBeVisible();
  await expect(page.getByLabel("Extracted letter text")).toHaveValue(/approved for rental assistance/);

  await page.getByRole("button", { name: /analyze letter/i }).click();
  await expect(page.getByRole("heading", { name: "Approval" })).toBeVisible();
  await expect(page.getByText("Evidence packet outline")).toBeVisible();

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
