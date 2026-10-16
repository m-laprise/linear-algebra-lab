import { test, expect, type Page, type Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
async function edit(page: Page, label: string, value: string) {
  const input = page.getByRole("textbox", { name: label, exact: true });
  await input.fill(value);
  await input.press("Enter");
}
async function shape(page: Page, m: number, n: number) {
  await page.getByLabel("Rows: output dimension").selectOption(String(m));
  await page.getByLabel("Columns: input dimension").selectOption(String(n));
}
async function center(locator: Locator) {
  const b = (await locator.boundingBox())!;
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}
test.beforeEach(async ({ page }) => {
  await page.goto("/linear-algebra/");
});
test("named examples persist and manual edits identify custom matrices", async ({
  page,
}) => {
  const menu = page.getByLabel("Named matrix example");
  await expect(menu).toHaveValue("identity");
  await menu.selectOption("shear");
  await expect(menu).toHaveValue("shear");
  await edit(page, "x coordinate 1", "2");
  await expect(menu).toHaveValue("shear");
  await edit(page, "A row 1 column 2", "1.5");
  await expect(menu).toHaveValue("custom");
  await page.getByRole("tab", { name: "Bases", exact: true }).click();
  const basisMenu = page.getByLabel("Named basis example");
  await basisMenu.selectOption("oblique");
  await expect(basisMenu).toHaveValue("oblique");
  await edit(page, "v coordinate 1", "3");
  await expect(basisMenu).toHaveValue("oblique");
  await edit(page, "B row 1 column 2", "1.5");
  await expect(basisMenu).toHaveValue("custom");
});
test("reset preserves the active tab and OLS toggle follows the main panel", async ({
  page,
}) => {
  await page.getByRole("tab", { name: "Bases", exact: true }).click();
  await page.getByLabel("Basis dimension").selectOption("3");
  await page.getByLabel("Show OLS example").check();
  expect(
    await page
      .locator(".ols-toggle")
      .evaluate((el) => el.previousElementSibling?.id),
  ).toBe("bases-panel");
  expect(
    await page
      .locator(".ols-toggle")
      .evaluate((el) => el.nextElementSibling?.getAttribute("aria-label")),
  ).toBe("OLS example");
  await page.getByRole("button", { name: "Reset all" }).click();
  await expect(
    page.getByRole("tab", { name: "Bases", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.getByLabel("Basis dimension")).toHaveValue("2");
  await expect(page.getByLabel("Named basis example")).toHaveValue("standard");
  await expect(page.getByLabel("Show OLS example")).not.toBeChecked();
});
test("accessible controls and math in primary, basis, and OLS views", async ({
  page,
}) => {
  const check = async () =>
    expect(
      (
        await new AxeBuilder({ page })
          .include("#linear-algebra-root")
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
  await check();
  await page.getByRole("button", { name: "Show inverse", exact: true }).click();
  await check();
  await page
    .getByRole("button", { name: "Show transpose", exact: true })
    .click();
  await page.getByText("Entry correspondence", { exact: true }).click();
  await check();
  await page.getByRole("tab", { name: "Matrices", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Bases", exact: true }),
  ).toBeFocused();
  await check();
  await page.getByLabel("Show OLS example").check();
  await check();
});
test("initial state, sources, reset, and isolated optional views", async ({
  page,
}) => {
  await expect(
    page.getByRole("heading", { name: "Linear Algebra Lab" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "View source on GitHub" }),
  ).toHaveAttribute("href", "https://github.com/m-laprise/linear-algebra-lab");
  await expect(page.getByRole("region", { name: "Inverse check" })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("heading", { name: "Transpose entries" }),
  ).toHaveCount(0);
  await expect(page.getByRole("region", { name: "OLS example" })).toHaveCount(
    0,
  );
  await edit(page, "A row 1 column 1", "2.5");
  await page.getByLabel("Show OLS example").check();
  await edit(page, "y coordinate 1", "-2");
  await page.getByLabel("Show OLS example").uncheck();
  await expect(
    page.getByLabel("A row 1 column 1", { exact: true }),
  ).toHaveValue("2.5");
  await page.getByLabel("Show OLS example").check();
  await expect(page.getByLabel("y coordinate 1", { exact: true })).toHaveValue(
    "-2",
  );
  await page.getByRole("button", { name: "Show inverse", exact: true }).click();
  await page.getByRole("button", { name: "Reset all" }).click();
  await expect(
    page.getByLabel("A row 1 column 1", { exact: true }),
  ).toHaveValue("1");
  await expect(page.getByLabel("Show OLS example")).not.toBeChecked();
  await expect(page.getByRole("region", { name: "Inverse check" })).toHaveCount(
    0,
  );
});
test("all nine shapes have correct spaces, columns, determinant and transpose dimensions", async ({
  page,
}) => {
  for (let m = 1; m <= 3; m++)
    for (let n = 1; n <= 3; n++) {
      await shape(page, m, n);
      await expect(
        page.getByRole("region", { name: "Input space", exact: true }),
      ).toHaveAttribute("data-dimension", String(n));
      await expect(
        page.getByRole("region", { name: "Output space", exact: true }),
      ).toHaveAttribute("data-dimension", String(m));
      await expect(page.locator('[data-arrow^="column-"]')).toHaveCount(n);
      await expect(page.getByTestId("rank")).toHaveText(String(Math.min(m, n)));
      await expect(page.getByTestId("determinant")).toHaveText(
        m === n ? "1" : "Not defined",
      );
      await page
        .getByRole("button", { name: "Show transpose", exact: true })
        .click();
      await expect(
        page.getByRole("region", { name: "Input space", exact: true }),
      ).toHaveAttribute("data-dimension", String(m));
      await expect(
        page.getByRole("region", { name: "Output space", exact: true }),
      ).toHaveAttribute("data-dimension", String(n));
      await expect(
        page
          .getByRole("group", { name: "u coordinates", exact: true })
          .getByRole("textbox"),
      ).toHaveCount(m);
      await page
        .getByRole("button", { name: "Hide transpose", exact: true })
        .click();
    }
});
test("inverse applies its own matrix and input, with exact fractions and undefined cases", async ({
  page,
}) => {
  await edit(page, "A row 1 column 1", "3");
  await edit(page, "A row 2 column 2", "3");
  await page.getByRole("button", { name: "Show inverse", exact: true }).click();
  const operation = page.getByRole("region", { name: "Displayed operation" });
  await expect(operation).toContainText("Inverse transformation");
  await expect(operation.locator("annotation").nth(1)).toContainText(
    "frac{1}{3}",
  );
  await expect(page.getByTestId("rank")).toHaveText("2");
  await expect(page.getByTestId("determinant")).toHaveText("1/9");
  await expect(page.locator('[data-arrow="output"]')).toHaveAttribute(
    "data-coordinates",
    "(1/3, 1/6)",
  );
  for (const [j, value] of ["(1/3, 0)", "(0, 1/3)"].entries()) {
    await expect(page.locator(`[data-arrow="column-${j}"]`)).toHaveAttribute(
      "data-coordinates",
      value,
    );
    await expect(page.getByTestId(`column-${j}-endpoint`)).not.toHaveAttribute(
      "role",
      "button",
    );
  }
  await edit(page, "y coordinate 1", "2");
  await edit(page, "y coordinate 2", "3");
  await expect(page.locator('[data-arrow="output"]')).toHaveAttribute(
    "data-coordinates",
    "(2/3, 1)",
  );
  await expect(page.getByTestId("inverse-recovered")).toHaveText(
    "Recovered y = (2, 3)",
  );
  await page.getByRole("button", { name: "Hide inverse", exact: true }).click();
  await expect(page.getByTestId("determinant")).toHaveText("9");
  await expect(page.getByLabel("x coordinate 1", { exact: true })).toHaveValue(
    "1",
  );
  await page.getByRole("button", { name: "Show inverse", exact: true }).click();
  await expect(page.getByLabel("y coordinate 1", { exact: true })).toHaveValue(
    "2",
  );
  await page.getByLabel("Named matrix example").selectOption("dependent");
  await expect(operation).toContainText("singular");
  await expect(
    page.getByText("The plots show A⁻¹", { exact: false }),
  ).toHaveCount(0);
  await expect(page.getByTestId("rank")).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Output space", exact: true }),
  ).toHaveCount(0);
  await shape(page, 2, 3);
  await page.getByRole("button", { name: "Show inverse", exact: true }).click();
  await expect(operation).toContainText("rectangular");
  await expect(
    page.getByRole("region", { name: "Output space", exact: true }),
  ).toHaveCount(0);
});
test("shear, inverse, and transpose use matching columns, products, and unit shapes", async ({
  page,
}) => {
  await page.getByLabel("Named matrix example").selectOption("shear");
  const fixtures = [
    { input: "x", output: "(2, 1)", columns: ["(1, 0)", "(1, 1)"] },
    {
      input: "y",
      button: "Show inverse",
      output: "(0, 1)",
      columns: ["(1, 0)", "(-1, 1)"],
    },
    {
      input: "u",
      button: "Show transpose",
      output: "(1, 2)",
      columns: ["(1, 1)", "(0, 1)"],
    },
  ];
  const output = page.getByRole("region", {
    name: "Output space",
    exact: true,
  });
  for (const fixture of fixtures) {
    if (fixture.button)
      await page
        .getByRole("button", { name: fixture.button, exact: true })
        .click();
    await edit(page, `${fixture.input} coordinate 1`, "1");
    await edit(page, `${fixture.input} coordinate 2`, "1");
    await expect(output.locator('[data-arrow="output"]')).toHaveAttribute(
      "data-coordinates",
      fixture.output,
    );
    for (const [j, value] of fixture.columns.entries()) {
      const column = output.locator(`[data-arrow="column-${j}"]`);
      await expect(column).toHaveAttribute("data-coordinates", value);
      // Edges from the origin are the transformed standard basis vectors.
      const edge = output.getByTestId("unit-image").locator("line").nth(j);
      for (const attribute of ["x1", "y1", "x2", "y2"])
        await expect(edge).toHaveAttribute(
          attribute,
          (await column.locator("line").first().getAttribute(attribute))!,
        );
    }
    await expect(
      page.getByLabel("A row 1 column 2", { exact: true }),
    ).toHaveValue("1");
    await expect(
      page.getByLabel("A row 2 column 1", { exact: true }),
    ).toHaveValue("0");
    await expect(page.getByLabel("Named matrix example")).toHaveValue("shear");
  }
});
test("entry validation preserves math state; keyboard values remain on the grid", async ({
  page,
}) => {
  const entry = page.getByLabel("A row 1 column 1", { exact: true });
  await edit(page, "A row 1 column 1", "0.3");
  await expect(entry).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByTestId("determinant")).toHaveText("1");
  await entry.press("Escape");
  await expect(entry).toHaveValue("1");
  await entry.press("ArrowDown");
  await expect(entry).toHaveValue("0.5");
  await expect(page.getByTestId("determinant")).toHaveText("1/2");
  await edit(page, "A row 1 column 1", "-3");
  await entry.press("ArrowDown");
  await expect(entry).toHaveValue("-3");
  await expect(page.locator('[data-arrow="column-0"]')).toHaveAttribute(
    "data-coordinates",
    "(-3, 0)",
  );
  await edit(page, "A row 1 column 1", "7");
  await page.getByLabel("Named matrix example").selectOption("identity");
  await expect(entry).toHaveValue("1");
  await expect(entry).toHaveAttribute("aria-invalid", "false");
});
test("2D and 1D dragging snaps, respects bounds, and updates matrix values", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1400, height: 1000 });
  const endpoint = page.getByTestId("input-endpoint");
  const p = await center(endpoint);
  const scale = await endpoint.evaluate(
    (el) => el.ownerSVGElement!.getScreenCTM()!.a,
  );
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await page.mouse.move(p.x - 36 * scale, p.y + 17 * scale, { steps: 5 });
  await page.mouse.up();
  await expect(page.getByLabel("x coordinate 1", { exact: true })).toHaveValue(
    "-0.5",
  );
  await expect(page.getByLabel("x coordinate 2", { exact: true })).toHaveValue(
    "0",
  );
  const col = page.getByTestId("column-0-endpoint"),
    c = await center(col);
  await page.mouse.move(c.x, c.y);
  await page.mouse.down();
  await page.mouse.move(c.x + 120 * scale, c.y - 120 * scale);
  await page.mouse.up();
  await expect(
    page.getByLabel("A row 1 column 1", { exact: true }),
  ).toHaveValue("3");
  await expect(
    page.getByLabel("A row 2 column 1", { exact: true }),
  ).toHaveValue("3");
  await shape(page, 1, 1);
  const p1 = await center(page.getByTestId("input-endpoint"));
  await page.mouse.move(p1.x, p1.y);
  await page.mouse.down();
  await page.mouse.move(p1.x - 25 * scale, p1.y - 80);
  await page.mouse.up();
  await expect(page.getByLabel("x coordinate 1", { exact: true })).toHaveValue(
    "0",
  );
});
test("3D handles move along the chosen mathematical axis after orbit", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await shape(page, 3, 3);
  const space = page.getByRole("region", { name: "Input space", exact: true }),
    svg = space.locator("svg"),
    b = (await svg.boundingBox())!;
  await page.mouse.move(b.x + 20, b.y + 20);
  await page.mouse.down();
  await page.mouse.move(b.x + 70, b.y + 45, { steps: 5 });
  await page.mouse.up();
  await space.getByRole("button", { name: "x", exact: true }).click();
  for (let axis = 0; axis < 3; axis++) {
    const p = await center(page.getByTestId("input-endpoint")),
      h = await center(
        page.getByTestId(`input-handle-${axis}`).locator("circle"),
      );
    const units = Number(
      await page.getByTestId(`input-handle-${axis}`).getAttribute("data-units"),
    );
    await page.mouse.move(h.x, h.y);
    await page.mouse.down();
    await page.mouse.move(
      h.x + (h.x - p.x) / units,
      h.y + (h.y - p.y) / units,
      { steps: 5 },
    );
    await page.mouse.up();
    await expect(
      page.getByLabel(`x coordinate ${axis + 1}`, { exact: true }),
    ).toHaveValue(axis === 0 ? "2" : "1.5");
  }
});
test("off-screen results retain true coordinates and show continuation", async ({
  page,
}) => {
  await shape(page, 3, 3);
  for (let i = 1; i <= 3; i++) {
    for (let j = 1; j <= 3; j++)
      await edit(page, `A row ${i} column ${j}`, "3");
    await edit(page, `x coordinate ${i}`, "3");
  }
  await expect(page.locator('[data-arrow="output"]')).toHaveAttribute(
    "data-coordinates",
    "(27, 27, 27)",
  );
  await expect(page.locator('[data-arrow="output"]')).toHaveAttribute(
    "data-outside",
    "true",
  );
  await expect(page.locator('[data-arrow="output"]')).toContainText(
    "continues",
  );
  await expect(
    page.getByRole("region", { name: "Output space", exact: true }),
  ).toContainText("(27, 27, 27) outside view");
});
test("basis edits keep v fixed; singular sets never invent coordinates", async ({
  page,
}) => {
  await page.getByRole("tab", { name: "Bases", exact: true }).click();
  await page.getByLabel("Named basis example").selectOption("oblique");
  await expect(page.locator('[data-arrow="target"]')).toHaveAttribute(
    "data-coordinates",
    "(2, 1)",
  );
  await expect(page.locator('[data-arrow="coordinates"]')).toHaveAttribute(
    "data-coordinates",
    "(1, 1)",
  );
  await page.getByLabel("Named basis example").selectOption("standard");
  await edit(page, "B row 1 column 1", "3");
  await edit(page, "B row 2 column 2", "3");
  await expect(page.locator('[data-arrow="coordinates"]')).toHaveAttribute(
    "data-coordinates",
    "(2/3, 1/3)",
  );
  await expect(
    page.getByRole("region", { name: "Basis coordinate space", exact: true }),
  ).toContainText("Read-only coefficients");
  await expect(page.getByTestId("coordinates-endpoint")).not.toHaveAttribute(
    "role",
    "button",
  );
  await page.getByLabel("Named basis example").selectOption("dependent");
  await expect(page.getByText("Not a basis", { exact: true })).toBeVisible();
  await expect(page.locator('[data-arrow="coordinates"]')).toHaveCount(0);
  await expect(page.locator('[data-arrow="target"]')).toHaveAttribute(
    "data-coordinates",
    "(2, 1)",
  );
});
test("OLS residual is a displacement, with correct exact coordinates", async ({
  page,
}) => {
  await page.getByLabel("Show OLS example").check();
  await expect(page.getByTestId("ols-fitted")).toHaveText(
    "Fitted ŷ = (4/3, 4/3, 4/3)",
  );
  await expect(page.getByTestId("ols-residual")).toHaveText(
    "Residual r = (-1/3, 2/3, -1/3)",
  );
  await expect(page.locator('[data-arrow="residual"]')).toHaveAttribute(
    "data-coordinates",
    "(-1/3, 2/3, -1/3)",
  );
});
test("mobile page fits and has no browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByRole("button", { name: "Reset all" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("tab", { name: "Bases", exact: true }).click();
  await page.getByLabel("Basis dimension").selectOption("3");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test("overlapping zero columns can each be selected and moved", async ({
  page,
}) => {
  await page.getByLabel("Named matrix example").selectOption("zero");
  const space = page.getByRole("region", { name: "Output space", exact: true });
  for (let j = 0; j < 2; j++) {
    await space.getByRole("button", { name: `a${j + 1}`, exact: true }).click();
    const endpoint = space.getByTestId(`column-${j}-endpoint`);
    await endpoint.focus();
    await endpoint.press(j === 0 ? "ArrowRight" : "ArrowUp");
  }
  await expect(
    page.getByLabel("A row 1 column 1", { exact: true }),
  ).toHaveValue("0.5");
  await expect(
    page.getByLabel("A row 2 column 2", { exact: true }),
  ).toHaveValue("0.5");
  await expect(page.getByTestId("rank")).toHaveText("2");
});
test("transpose entry mapping and independent probe preserve the original input", async ({
  page,
}) => {
  await shape(page, 2, 3);
  await edit(page, "A row 2 column 3", "-2.5");
  await edit(page, "x coordinate 3", "3");
  await page
    .getByRole("button", { name: "Show transpose", exact: true })
    .click();
  await page.getByText("Entry correspondence", { exact: true }).click();
  await page
    .getByRole("button", { name: "original entry row 2 column 3", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "transpose entry row 3 column 2",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", {
      name: "transpose entry row 3 column 2",
      exact: true,
    }),
  ).toHaveText("-5/2");
  await edit(page, "u coordinate 1", "-2");
  await page
    .getByRole("button", { name: "Hide transpose", exact: true })
    .click();
  await expect(page.getByLabel("x coordinate 3", { exact: true })).toHaveValue(
    "3",
  );
  await expect(
    page.getByLabel("A row 2 column 3", { exact: true }),
  ).toHaveValue("-2.5");
});
test("visual review snapshots", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium");
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.screenshot({
    path: "test-results/dashboard-2d.png",
    fullPage: true,
  });
  await page.getByLabel("Named matrix example").selectOption("shear");
  await page.getByRole("button", { name: "Show inverse", exact: true }).click();
  await page.screenshot({
    path: "test-results/dashboard-inverse.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Show transpose", exact: true })
    .click();
  await page.getByText("Entry correspondence", { exact: true }).click();
  await page.screenshot({
    path: "test-results/dashboard-transpose.png",
    fullPage: true,
  });
  await page.getByRole("tab", { name: "Bases", exact: true }).click();
  await page.getByLabel("Named basis example").selectOption("oblique");
  await page.screenshot({
    path: "test-results/dashboard-bases.png",
    fullPage: true,
  });
  await page.getByRole("tab", { name: "Matrices", exact: true }).click();
  await shape(page, 3, 3);
  await page.getByLabel("Named matrix example").selectOption("shear");
  await page.screenshot({
    path: "test-results/dashboard-3d.png",
    fullPage: true,
  });
  await page.getByLabel("Show OLS example").check();
  await page.screenshot({
    path: "test-results/dashboard-ols.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/dashboard-mobile.png",
    fullPage: true,
  });
});
