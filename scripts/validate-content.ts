import {LAYER_OMISSIONS} from "../src/content/layer-omissions";
import {validateLayerOmissions} from "../src/lib/layer-availability";
import { BOOK, BOOK_ENTRIES_ORDERED } from "../src/content/book";
import chapterLinks from "../src/content/chapter-links.json";
import type { BookData, BookTextEntry } from "../src/lib/types";

export function validateContent(
  book: BookData,
  texts: BookTextEntry[],
  links: Record<string, string>,
): string[] {
  const errors: string[] = [];
  const check = (ok: unknown, message: string) => {
    if (!ok) errors.push(message);
  };
  const unique = (items: { id: string }[], name: string) => {
    const ids = items.map((x) => x.id);
    check(new Set(ids).size === ids.length, `${name}: повторяющиеся id`);
    return new Set(ids);
  };
  const entries = book.parts.flatMap((p) => p.entries);
  const tocIds = unique(entries, "Оглавление");
  const textIds = unique(texts, "Тексты");
  const chapters = unique(book.chapters, "Главы");
  const terms = unique(book.terms, "Термины");
  unique(book.parts, "Части");
  check(
    entries.length === 136 && book.parts.length === 12,
    "Ожидалось 136 записей и 12 частей",
  );
  for (const [id, chapter] of Object.entries(links)) {
    check(tocIds.has(id), `Карта глав: неизвестная запись ${id}`);
    check(chapters.has(chapter), `Карта глав: неизвестная глава ${chapter}`);
  }
  for (const entry of entries) {
    const text = texts.find((t) => t.id === entry.id);
    check(text, `${entry.id}: нет текста`);
    const chapter = (links as Record<string, string>)[entry.id] ?? null;
    check(
      (entry.chapterId ?? null) === chapter,
      `${entry.id}: устаревшая привязка в оглавлении`,
    );
    if (!text) continue;
    check(
      text.chapterId === chapter,
      `${entry.id}: устаревшая привязка в JSON`,
    );
    check(
      text.title === entry.title &&
        text.page === entry.page &&
        text.marker === entry.marker,
      `${entry.id}: метаданные текста отличаются от оглавления`,
    );
    const part = book.parts.find((p) =>
      p.entries.some((e) => e.id === entry.id),
    )!;
    check(
      text.partNum === part.num && text.partLabel === part.label,
      `${entry.id}: неверная часть`,
    );
    check(
      text.paragraphs.length > 0 && text.pageEnd >= text.page,
      `${entry.id}: пустой текст или неверные страницы`,
    );
    const notes = new Set(text.footnotes.map((f) => f.n));
    check(
      notes.size === text.footnotes.length,
      `${entry.id}: повторяющиеся сноски`,
    );
    for (const f of text.footnotes)
      check(f.text.trim(), `${entry.id}: пустая сноска ${f.n}`);
    for (const m of JSON.stringify(text.paragraphs).matchAll(
      /\{\{(\d+)\}\}/g,
    )) {
      check(notes.has(Number(m[1])), `${entry.id}: нет текста сноски ${m[1]}`);
    }
  }
  for (const id of textIds)
    check(tocIds.has(id), `${id}: текст отсутствует в оглавлении`);
  for (const chapter of book.chapters) {
    unique(chapter.sections, chapter.id);
    for (const section of chapter.sections) {
      for (const evidence of section.evidence ?? []) {
        const source = texts.find((entry) => entry.id === evidence.entryId);
        check(
          source,
          `${chapter.id}/${section.id}: неизвестный источник ${evidence.entryId}`,
        );
        check(
          evidence.paragraphs.length > 0 &&
            evidence.paragraphs.every(
              (index) =>
                Number.isInteger(index) &&
                index >= 0 &&
                source &&
                index < source.paragraphs.length,
            ),
          `${chapter.id}/${section.id}: неверные абзацы источника`,
        );
      }
    }

    check(
      Object.values(links).includes(chapter.id),
      `${chapter.id}: глава не привязана к записи`,
    );
  }
  for (const m of JSON.stringify(book).matchAll(/\[\[term:([^\]]+)\]\]/g)) {
    check(terms.has(m[1]), `Неизвестный термин: ${m[1]}`);
  }
  return errors;
}

if (import.meta.main) {
  const errors = [...validateContent(BOOK, BOOK_ENTRIES_ORDERED, chapterLinks),...validateLayerOmissions(BOOK.parts,BOOK.chapters,LAYER_OMISSIONS)];
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  console.log(
    `Контент проверен: ${BOOK_ENTRIES_ORDERED.length} записей, ${BOOK.chapters.length} глав, ${BOOK.terms.length} терминов.`,
  );
}
