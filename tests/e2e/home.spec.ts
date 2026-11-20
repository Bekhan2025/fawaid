import { test, expect } from "@playwright/test";
import { BOOK_ENTRIES_ORDERED } from "../../src/content/book";

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => { throw error; });
});

test("home presents the book and opens reading from the beginning", async ({ page }, info) => {
  await page.goto("./");
  await expect(page.getByRole("heading", { name: "АЛЬ-ФАВАИД", exact: true })).toBeVisible();
  await expect(page.getByText("Полезные наставления", { exact: true })).toBeVisible();
  for (const name of ["Читай", "Размышляй", "Действуй", "Распространяй"]) {
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  expect(new URL(page.url()).search).toBe("");
  await expect(page.getByRole("link", { name: "Продолжить чтение" })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.screenshot({ path: info.outputPath("home-light.png"), fullPage: true });
  await page.getByRole("button", { name: "Переключить тему: дневная бумага или ночь" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.screenshot({ path: info.outputPath("home-dark.png"), fullPage: true });
  await page.getByRole("link", { name: "Начать чтение" }).click();
  const first = [...BOOK_ENTRIES_ORDERED].sort((a, b) => a.page - b.page)[0];
  await expect(page.getByRole("heading", { name: first.title, exact: true })).toBeVisible();
  expect(new URL(page.url()).searchParams.get("entry")).toBe(first.id);
  await page.goBack();
  await expect(page.getByRole("heading", { name: "АЛЬ-ФАВАИД", exact: true })).toBeVisible();
});

test("home stays visible with saved reading and resumes only on request", async ({ page }) => {
  await page.goto("./?entry=e41&layer=atlas");
  await expect(page.getByRole("tab", { name: /Слой «Атлас»/ })).toHaveAttribute("data-state", "active");
  await page.getByRole("link", { name: "На главную", exact: true }).click();
  await expect(page.getByRole("heading", { name: "АЛЬ-ФАВАИД", exact: true })).toBeVisible();
  expect(new URL(page.url()).search).toBe("");
  await page.reload();
  await expect(page.getByRole("heading", { name: "АЛЬ-ФАВАИД", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Продолжить чтение" }).click();
  await expect(page).toHaveURL(/entry=e41&layer=atlas/);
  await expect(page.getByRole("tab", { name: /Слой «Атлас»/ })).toHaveAttribute("data-state", "active");
});

test("home can start reading when local storage is unavailable", async ({ page, context }) => {
  await context.addInitScript(() => Object.defineProperty(window, "localStorage", {
    get() { throw new Error("disabled"); },
  }));
  await page.goto("./");
  await expect(page.getByRole("heading", { name: "АЛЬ-ФАВАИД", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Продолжить чтение" })).toHaveCount(0);
  await page.getByRole("link", { name: "Начать чтение" }).click();
  await expect(page.locator(".book-page")).toBeVisible();
});
