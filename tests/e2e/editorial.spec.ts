import { test, expect } from "@playwright/test";
test("e12 editorial conditions, question and evidence", async ({
  page,
}, info) => {
  page.on("pageerror", (error) => {
    throw error;
  });
  await page.goto("./?entry=e12&layer=razbor");
  await expect(
    page.getByRole("heading", {
      name: "Почему в аяте сказано «или»",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Слой «Атлас»" }).click();
  await expect(
    page.getByText("Все условия действуют совместно", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Отсутствие препятствия", { exact: true }),
  ).toBeVisible();
  await page
    .getByText("Аят, на котором построен разбор", { exact: true })
    .click();
  await expect(page.getByRole("blockquote").first()).toContainText(
    "или кто прислушивается и присутствует при этом",
  );
  await expect(
    page.getByRole("heading", {
      name: "Убеждённость в этом мире и в мире вечном",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText("готовится");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: info.outputPath("e12-light.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Переключить тему: дневная бумага или ночь" })
    .click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: info.outputPath("e12-dark.png"),
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Открыть фрагмент в книге · с. 12–15" })
    .first()
    .click();
  await expect(page).toHaveURL(/entry=e12&layer=book#e12-para-1/);
  expect(new URL(page.url()).pathname).toBe(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/`);
  await expect(page.locator("#e12-para-1")).toBeFocused();
});

test("e299 editorial separates impact branches and retains source quotations", async ({
  page,
}, info) => {
  page.on("pageerror", (error) => {
    throw error;
  });
  await page.goto("./?entry=e299&layer=razbor");
  await expect(
    page.getByRole("heading", {
      name: "Две основы и их последствия",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Слой «Атлас»" }).click();
  const branches = page.getByLabel("Направления воздействия");
  await expect(
    branches.getByRole("heading", { name: "В самом человеке", exact: true }),
  ).toBeVisible();
  await expect(
    branches.getByRole("heading", { name: "В передаче другому", exact: true }),
  ).toBeVisible();
  await expect(branches.getByRole("list")).toHaveCount(2);
  await page
    .getByText("Хадис, приведённый автором, и образ недуга", { exact: true })
    .click();
  await expect(page.locator("#truthfulness-spread blockquote")).toContainText(
    "Пророк ﷺ",
  );
  await expect(page.locator("#truthfulness-spread blockquote")).toContainText(
    "если только Аллах",
  );
  const summary = page.getByText("Четыре аята в завершении записи", {
    exact: true,
  });
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.locator("#truthfulness-foundation blockquote").last(),
  ).toContainText("сура 9 «Покаяние», аят 90");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await expect(page.locator("body")).not.toContainText("готовится");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: info.outputPath("e299-light.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Переключить тему: дневная бумага или ночь" })
    .click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: info.outputPath("e299-dark.png"),
    fullPage: true,
  });
});

test('e41 editorial maps verses to concepts without losing both powers',async({page},info)=>{
  page.on('pageerror',error=>{throw error});
  await page.goto('./?entry=e41&layer=razbor');
  await expect(page.getByRole('heading',{name:'Две силы, необходимые вместе',exact:true})).toBeVisible();
  await page.getByRole('tab',{name:'Слой «Атлас»'}).click();
  const map=page.locator('#fatiha-correspondence');
  await expect(map.getByText('Аяты 2–4',{exact:true})).toBeVisible();
  await expect(map.getByRole('heading',{name:'Нужда в руководстве',exact:true})).toBeVisible();
  await expect(map.getByRole('heading',{name:'Два вида отклонения',exact:true})).toBeVisible();
  await page.getByText('Поклонение, помощь и руководство',{exact:true}).click();
  await expect(map.locator('details[open] blockquote')).toContainText('Только Тебе мы поклоняемся');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:info.outputPath('e41-light.png'),fullPage:true});
  await page.getByRole('button',{name:'Переключить тему: дневная бумага или ночь'}).click();
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:info.outputPath('e41-dark.png'),fullPage:true});
});

test('e67 editorial keeps the exception for competition in good',async({page},info)=>{
  page.on('pageerror',error=>{throw error});
  await page.goto('./?entry=e67&layer=razbor');
  await expect(page.locator('#increase-distraction')).toContainText('Неумышленное отвлечение');
  await page.getByRole('tab',{name:'Слой «Атлас»'}).click();
  const boundary=page.locator('#increase-boundary');
  await expect(boundary.getByRole('heading',{name:'То, что приближает к Аллаху',exact:true})).toBeVisible();
  await expect(boundary).toContainText('исключены из порицания');
  await page.getByText('Заключительный хадис в тексте записи',{exact:true}).click();
  await expect(page.locator('#increase-wealth blockquote')).toContainText('Моё богатство!');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:info.outputPath('e67-light.png'),fullPage:true});
  await page.getByRole('button',{name:'Переключить тему: дневная бумага или ночь'}).click();
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:info.outputPath('e67-dark.png'),fullPage:true});
});

test('unprepared and intentionally omitted layers have distinct explanations',async({page})=>{
  await page.goto('./?entry=e38&layer=atlas');
  await expect(page.getByText('Атлас не предусмотрен',{exact:true})).toBeVisible();
  await expect(page.locator('main').last()).not.toContainText('появятся');
  await page.getByRole('tab',{name:'Слой «Разбор»'}).click();
  await expect(page.getByText('Разбор ещё не подготовлен',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Читать текст книги'}).click();
  await expect(page.locator('.book-page')).toBeVisible();
  await page.goto('./?entry=e61&layer=atlas');
  await expect(page.getByText('Атлас не предусмотрен',{exact:true})).toBeVisible();
  await page.goto('./?entry=e447&layer=atlas');
  await expect(page.getByText('Атлас ещё не подготовлен',{exact:true})).toBeVisible();
});

test('e292 editorial distinguishes co-occurrence from the author conclusion',async({page},info)=>{
  page.on('pageerror',error=>{throw error});
  await page.goto('./?entry=e292&layer=razbor');
  await expect(page.getByRole('heading',{name:'От свидетельств — к выводу о связи',exact:true})).toBeVisible();
  await page.getByRole('tab',{name:'Слой «Атлас»'}).click();
  await expect(page.locator('#guidance-pairs').getByText('Упомянуты вместе',{exact:true})).toHaveCount(4);
  await expect(page.locator('#guidance-inseparability')).toContainText('взаимосвязаны, взаимообязательны и неотделимы');
  await page.getByText('Прямой вывод о взаимосвязи',{exact:true}).click();
  await expect(page.locator('#guidance-inseparability details[open] blockquote')).toContainText('Они неотделимы друг от друга.');
  await expect(page.locator('body')).not.toContainText('готовится');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:info.outputPath('e292-light.png'),fullPage:true,animations:'disabled'});
  await page.getByRole('button',{name:'Переключить тему: дневная бумага или ночь'}).click();
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:info.outputPath('e292-dark.png'),fullPage:true,animations:'disabled'});
});
