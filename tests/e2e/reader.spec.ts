import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => {
    throw error;
  });
});
const tab = (name: string) => `Слой «${name}»`;

test("direct links, history, scroll resume and keyboard tabs", async ({
  page,
}) => {
  await page.goto("./?entry=e310&layer=atlas");
  await expect(page.getByRole("tab", { name: tab("Атлас") })).toHaveAttribute(
    "data-state",
    "active",
  );
  await page.getByRole("tab", { name: tab("Разбор") }).click();
  await expect(page).toHaveURL(/layer=razbor/);
  await page.goBack();
  await expect(page.getByRole("tab", { name: tab("Атлас") })).toHaveAttribute(
    "data-state",
    "active",
  );
  await page.goForward();
  await expect(page.getByRole("tab", { name: tab("Разбор") })).toHaveAttribute(
    "data-state",
    "active",
  );
  await page.getByRole("tab", { name: tab("Разбор") }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/entry=e310/);
  await page.goto("./?entry=e310&layer=book");
  await expect(
    page.getByRole("button", {
      name: "Добавить закладку: абзац 1",
      exact: true,
    }),
  ).toBeEnabled();
  await page.evaluate(() =>
    window.scrollTo({
      top: (document.documentElement.scrollHeight - innerHeight) * 0.45,
      behavior: "instant",
    }),
  );
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem("fawaid:reading:v1")!).position,
      ),
    )
    .toBeGreaterThan(0.4);
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(
        () => scrollY / (document.documentElement.scrollHeight - innerHeight),
      ),
    )
    .toBeGreaterThan(0.4);
  await page.goto("./");
  await expect(page.getByRole("heading", { name: "АЛЬ-ФАВАИД", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Продолжить чтение" }).click();
  await expect(page).toHaveURL(/entry=e310/);
});

test("footnotes return to the source and bookmarks persist", async ({
  page,
}) => {
  await page.goto("./?entry=e16&layer=book");
  const reference = page
    .getByRole("link", { name: "Сноска 2", exact: true })
    .first();
  await reference.click();
  await expect(page.locator("#e16-fn-2")).toBeFocused();
  await page
    .getByRole("button", { name: "Вернуться к сноске 2 в тексте", exact: true })
    .click();
  await expect(reference).toBeFocused();
  await page
    .getByRole("button", { name: "Добавить закладку: абзац 1", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", {
      name: "Удалить закладку: абзац 1",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Настройки чтения и закладки" })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "Закладки · 1" }),
  ).toBeVisible();
  await dialog
    .getByRole("button")
    .filter({ hasText: "О значениях и тонкостях" })
    .click();
  await expect(page).toHaveURL(/#e16-para-0/);
  await expect(page.locator("#e16-para-0")).toBeFocused();
  await page
    .getByRole("button", { name: "Удалить закладку: абзац 1", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Добавить закладку: абзац 1",
      exact: true,
    }),
  ).toBeVisible();
});

test("reading settings survive reload and reset", async ({ page }) => {
  await page.goto("./?entry=e310&layer=book");
  await page
    .getByRole("button", { name: "Настройки чтения и закладки" })
    .click();
  await page
    .getByLabel("Размер текста книги", { exact: true })
    .selectOption("22");
  await page
    .getByLabel("Межстрочный интервал", { exact: true })
    .selectOption("2");
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.locator(".book-page")).toHaveCSS("font-size", "22px");
  await expect(page.locator(".book-page")).toHaveCSS("line-height", "44px");
  await page
    .getByRole("button", { name: "Настройки чтения и закладки" })
    .click();
  await page.getByRole("button", { name: "Сбросить оформление" }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator(".book-page")).toHaveCSS("font-size", "18px");
});

test("search navigates to exact paragraphs and supports title and term scopes", async ({
  page,
}) => {
  await page.goto("./?entry=e310&layer=book");
  await page
    .getByRole("button", { name: "Поиск по книге", exact: true })
    .click();
  await page.getByLabel("Область поиска").selectOption("titles");
  await page
    .getByRole("textbox", { name: "Поисковый запрос" })
    .fill("Терпеть страсть");
  await expect(page.getByRole("dialog").getByRole("status")).toHaveText(
    "Найдено: 1",
  );
  await page
    .getByRole("dialog")
    .getByRole("button")
    .filter({ hasText: "Терпеть страсть" })
    .click();
  await expect(page).toHaveURL(/entry=e309/);
  await page
    .getByRole("button", { name: "Поиск по книге", exact: true })
    .click();
  await page.getByLabel("Область поиска").selectOption("text");
  await page
    .getByRole("textbox", { name: "Поисковый запрос" })
    .fill("тревоги заботы печали");
  await page
    .getByRole("dialog")
    .getByRole("button")
    .filter({ hasText: "Терпеть страсть" })
    .click();
  await expect(page).toHaveURL(/#e309-para-0/);
  await expect(page.locator("#e309-para-0")).toBeFocused();
  await page
    .getByRole("button", { name: "Поиск по книге", exact: true })
    .click();
  await page.getByLabel("Область поиска").selectOption("terms");
  await page
    .getByRole("textbox", { name: "Поисковый запрос" })
    .fill("васатийя");
  await expect(page.getByRole("dialog").getByRole("article")).toContainText(
    "умеренность, середина",
  );
  await page
    .getByRole("textbox", { name: "Поисковый запрос" })
    .fill("неттакогослова123");
  await expect(page.getByRole("dialog")).toContainText("Совпадений нет");
});

test("both prepared chapters, themes and spectrum hover", async ({
  page,
}, testInfo) => {
  await page.goto("./?entry=e309&layer=razbor");
  await expect(
    page.getByRole("heading", { name: "Цена удовлетворения страсти" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: tab("Атлас") }).click();
  await expect(page.getByRole("heading", { name: "Время" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(
    "Визуальная форма готовится",
  );
  await page
    .getByRole("button", { name: "Переключить тему: дневная бумага или ночь" })
    .click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBeTruthy();
  await page.screenshot({
    path: testInfo.outputPath("e309-dark.png"),
    fullPage: true,
  });
  await page.goto("./?entry=e310&layer=atlas");
  if (testInfo.project.name === "desktop") {
    const cell = page
      .locator("#pyat-kachestv .k2")
      .filter({ has: page.locator("p") })
      .first();
    await cell.hover();
    await expect(cell).toHaveClass(/ring-2/);
    await expect(page.locator("#pyat-kachestv .k2.ring-2")).toHaveCount(5);
  }
  await page
    .getByRole("button", { name: "Переключить тему: дневная бумага или ночь" })
    .click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.screenshot({
    path: testInfo.outputPath("e310-light.png"),
    fullPage: true,
  });
});

test("corrupt local data and storage denial do not break reading", async ({
  page,
  context,
}) => {
  await context.addInitScript(() => {
    localStorage.setItem("fawaid:preferences:v1", "bad json");
    localStorage.setItem("fawaid:reading:v1", "bad json");
  });
  await page.goto("./?entry=unknown&layer=atlas");
  await expect(page).toHaveURL(/entry=e310&layer=book/);
  await expect(page.locator(".book-page")).toBeVisible();
  const denied = await context.browser()!.newContext();
  await denied.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("disabled");
      },
    }),
  );
  const other = await denied.newPage();
  other.on("pageerror", (error) => {
    throw error;
  });
  await other.goto(new URL(`?entry=e310&layer=book`, page.url()).href);
  await other
    .getByRole("button", { name: "Настройки чтения и закладки" })
    .click();
  await expect(other.getByRole("dialog")).toContainText(
    "Сохранение недоступно",
  );
  await denied.close();
});

test('e187 preserves conditional branches and original source',async({page},info)=>{
  await page.goto('./?entry=e187&layer=razbor');
  await expect(page.getByRole('heading',{name:'Как различаются причины',exact:true})).toBeVisible();
  await page.getByRole('tab',{name:'Слой «Атлас»'}).click();
  await expect(page.getByRole('heading',{name:'Если ослабляет упование и лишает сердце собранности'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Если не ослабляет упование'})).toBeVisible();
  await expect(page.locator('body')).not.toContainText('готовится');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await page.screenshot({path:info.outputPath('e187-atlas.png'),fullPage:true});
  await page.getByRole('button',{name:'Переключить тему: дневная бумага или ночь'}).click();
  await page.screenshot({path:info.outputPath('e187-atlas-dark.png'),fullPage:true});
  await page.getByRole('tab',{name:'Слой «Книга»'}).click();
  await expect(page.locator('.book-page')).toContainText('Упование на Аллаха бывает двух видов.');
});
