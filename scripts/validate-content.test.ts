import { test } from "node:test";
import assert from "node:assert/strict";
import { BOOK, BOOK_ENTRIES_ORDERED } from "../src/content/book";
import links from "../src/content/chapter-links.json";
import { validateContent } from "./validate-content";

test("existing content has valid references", () => {
  assert.deepEqual(validateContent(BOOK, BOOK_ENTRIES_ORDERED, links), []);
});
test("detects lost text, duplicate IDs and stale chapter links", () => {
  const texts = structuredClone(BOOK_ENTRIES_ORDERED);
  texts.shift();
  texts.push(texts[0]);
  texts.find((e) => e.id === "e310")!.chapterId = null;
  const errors = validateContent(BOOK, texts, links).join("\n");
  assert.ok(errors.includes("нет текста"), errors);
  assert.ok(errors.includes("повторяющиеся id"), errors);
  assert.ok(errors.includes("устаревшая привязка в JSON"), errors);
});
test("detects unknown terms, unknown chapters and missing footnotes", () => {
  const book = structuredClone(BOOK);
  book.chapters.find((c) => c.id === "ch1")!.sections[0].lead =
    "[[term:missing-term]]";
  const texts = structuredClone(BOOK_ENTRIES_ORDERED);
  texts[0].paragraphs.push("Текст {{999999}}");
  const errors = validateContent(book, texts, {
    ...links,
    e310: "missing-chapter",
  }).join("\n");
  assert.ok(errors.includes("Неизвестный термин: missing-term"), errors);
  assert.ok(errors.includes("неизвестная глава missing-chapter"), errors);
  assert.ok(errors.includes("нет текста сноски 999999"), errors);
});

test("chapter links override frozen metadata without mutation or stale fallback", async () => {
  const { applyChapterLinks } = await import("../src/lib/chapter-links");
  const parts = [
    {
      id: "p",
      num: "I",
      label: "Part",
      entries: [{ id: "e", page: 1, marker: "", title: "", chapterId: "old" }],
    },
  ];
  const texts = [
    {
      id: "e",
      page: 1,
      pageEnd: 1,
      marker: "",
      title: "",
      partNum: "I",
      partLabel: "Part",
      paragraphs: ["immutable"],
      footnotes: [],
      chapterId: "old",
    },
  ];
  const before = JSON.stringify({ parts, texts });
  assert.equal(
    applyChapterLinks(parts, texts, { e: "new" }).texts[0].chapterId,
    "new",
  );
  assert.equal(applyChapterLinks(parts, texts, {}).texts[0].chapterId, null);
  assert.equal(
    applyChapterLinks(parts, texts, {}).parts[0].entries[0].chapterId,
    undefined,
  );
  assert.equal(JSON.stringify({ parts, texts }), before);
  assert.ok(
    BOOK.parts.flatMap((p) => p.entries).find((e) => e.id === "e187")
      ?.chapterId === "ch3",
  );
});

test("source evidence rejects missing entries and invalid paragraph references", () => {
  const book = structuredClone(BOOK);
  book.chapters[0].sections[0].evidence = [
    { label: "bad", entryId: "e-missing", paragraphs: [0] },
  ];
  assert.ok(
    validateContent(book, BOOK_ENTRIES_ORDERED, links).some((message) =>
      message.includes("неизвестный источник"),
    ),
  );
  book.chapters[0].sections[0].evidence = [
    { label: "bad", entryId: "e12", paragraphs: [9999] },
  ];
  assert.ok(
    validateContent(book, BOOK_ENTRIES_ORDERED, links).some((message) =>
      message.includes("неверные абзацы источника"),
    ),
  );
});
