import { chromium, firefox, webkit } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
const url =
  process.env.LAB_HUGO_URL ||
  "http://host.docker.internal:5180/linear-algebra/";
fs.mkdirSync(".preview/screenshots", { recursive: true });
for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await engine.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400 && new URL(r.url()).host === new URL(url).host)
      errors.push(`${r.status()} ${r.url()}`);
  });
  await page.goto(url);
  await page.getByRole("heading", { name: "Linear Algebra Lab" }).waitFor();
  const nav = page.locator("#navbar-main");
  assert.equal(await nav.count(), 1);
  const tab = nav.getByRole("link", { name: "Teaching material", exact: true });
  assert.equal(await tab.getAttribute("aria-current"), "page");
  assert.match(await tab.getAttribute("class"), /active/);
  assert.equal(await nav.locator('a[aria-current="page"]').count(), 1);
  assert.equal(await nav.locator("a.nav-link.active").count(), 1);
  assert.equal(
    await nav.getByRole("link", { name: "Teaching", exact: true }).count(),
    1,
  );
  assert.equal(
    await page.getByRole("region", { name: "OLS example" }).count(),
    0,
  );
  assert.equal(await page.getByTestId("rank").textContent(), "2");
  await page.locator(".matrix-size > summary").click();
  await page.getByLabel("Rows: output dimension").selectOption("3");
  await page.getByLabel("Columns: input dimension").selectOption("2");
  assert.equal(
    await page.getByTestId("determinant").textContent(),
    "Not defined",
  );
  await page.locator(".operations > summary").click();
  await page.getByRole("radio", { name: "Transpose Aᵀ", exact: true }).check();
  assert.equal(
    await page
      .getByRole("region", { name: "Input vector", exact: true })
      .getAttribute("data-dimension"),
    "3",
  );
  assert.equal(
    await page
      .getByRole("region", { name: "Output vector", exact: true })
      .getAttribute("data-dimension"),
    "2",
  );
  await page.reload();
  await page.getByRole("heading", { name: "Linear Algebra Lab" }).waitFor();
  await page.evaluate(() => window.scrollTo(0, 0));
  if (name === "chromium")
    await page.screenshot({
      path: ".preview/screenshots/hugo-desktop.png",
      fullPage: true,
    });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    true,
  );
  await nav.getByRole("button", { name: "Toggle navigation" }).click();
  await tab.waitFor({ state: "visible" });
  if (name === "chromium")
    await page.screenshot({
      path: ".preview/screenshots/hugo-mobile.png",
      fullPage: true,
    });
  assert.deepEqual(errors, []);
  await browser.close();
  console.log(
    `${name}: Hugo header, active tab, subpath assets, reload, dimensions, mobile menu passed`,
  );
}
