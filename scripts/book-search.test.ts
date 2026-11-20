import { test } from "node:test";
import assert from "node:assert/strict";
import { BOOK, BOOK_ENTRIES_ORDERED } from "../src/content/book";
import {
  buildSearchIndex,
  searchIndex,
  searchExcerpt,
} from "../src/lib/book-search";
const index = buildSearchIndex(BOOK, BOOK_ENTRIES_ORDERED);
test("search ignores case and ё while retaining original text and paragraph targets", () => {
  const result = searchIndex(
    index,
    "У НРАВСТВЕННОСТИ ЕСТЬ ПРЕДЕЛ",
    "text",
  ).find((r) => r.entryId === "e310");
  assert.ok(result?.target?.startsWith("e310-para-"));
  assert.equal(
    searchIndex(
      [{ key: "x", kind: "text", title: "", text: "Всё живёт" }],
      "ВСЕ ЖИВЕТ",
    ).length,
    1,
  );
  assert.ok(result?.text.includes("У нравственности"));
});
test("search scopes separate titles, paragraphs, footnotes and dictionary", () => {
  assert.ok(
    searchIndex(index, "нравственности", "titles").every(
      (r) => r.kind === "title",
    ),
  );
  assert.ok(
    searchIndex(index, "середина", "terms").some(
      (r) => r.termId === "vasatiyya",
    ),
  );
  assert.ok(index.some((r) => r.target?.includes("-fn-")));
  assert.equal(searchIndex(index, "   ").length, 0);
  assert.equal(searchIndex(index, "несуществующаястрокадлятеста").length, 0);
  assert.ok(
    searchExcerpt(
      "а".repeat(300) + "найдено" + "б".repeat(300),
      "найдено",
    ).includes("найдено"),
  );
});
