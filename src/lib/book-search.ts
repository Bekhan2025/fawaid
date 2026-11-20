import type { BookData, BookPara, BookTextEntry } from "./types";

export type SearchScope = "all" | "titles" | "text" | "terms";
export interface SearchResult {
  key: string;
  kind: "title" | "text" | "term";
  title: string;
  text: string;
  entryId?: string;
  target?: string;
  page?: number;
  termId?: string;
}
export const paragraphId = (entryId: string, index: number) =>
  `${entryId}-para-${index}`;
export function paragraphText(p: BookPara): string {
  return typeof p === "string"
    ? p
    : "verse" in p
      ? p.verse.join(" ")
      : p.center;
}
export function normalizeSearch(value: string): string {
  return value.toLocaleLowerCase("ru").replaceAll("ё", "е");
}
export function searchWords(query: string): string[] {
  return [
    ...new Set(normalizeSearch(query).trim().split(/\s+/).filter(Boolean)),
  ];
}
const plain = (value: string) =>
  value.replace(/\{\{\d+\}\}/g, "").replaceAll("**", "");
export function buildSearchIndex(
  book: BookData,
  texts: BookTextEntry[],
): SearchResult[] {
  const index: SearchResult[] = [];
  for (const entry of [...texts].sort((a, b) => a.page - b.page)) {
    index.push({
      key: `${entry.id}-title`,
      kind: "title",
      title: entry.title,
      text: entry.title,
      entryId: entry.id,
      page: entry.page,
    });
    entry.paragraphs.forEach((p, i) =>
      index.push({
        key: paragraphId(entry.id, i),
        kind: "text",
        title: entry.title,
        text: plain(paragraphText(p)),
        entryId: entry.id,
        target: paragraphId(entry.id, i),
        page: entry.page,
      }),
    );
    for (const note of entry.footnotes)
      index.push({
        key: `${entry.id}-fn-${note.n}`,
        kind: "text",
        title: `${entry.title} · сноска ${note.n}`,
        text: plain(note.text),
        entryId: entry.id,
        target: `${entry.id}-fn-${note.n}`,
        page: entry.page,
      });
  }
  for (const term of book.terms)
    index.push({
      key: `term-${term.id}`,
      kind: "term",
      title: term.ru,
      text: [term.ru, term.ar, term.translit, term.short, term.note]
        .filter(Boolean)
        .join(" · "),
      termId: term.id,
    });
  return index;
}
export function searchIndex(
  index: SearchResult[],
  query: string,
  scope: SearchScope = "all",
): SearchResult[] {
  const words = searchWords(query);
  if (!words.length) return [];
  return index.filter(
    (item) =>
      (scope === "all" ||
        (scope === "titles"
          ? item.kind === "title"
          : scope === "terms"
            ? item.kind === "term"
            : item.kind === "text")) &&
      words.every((word) => normalizeSearch(item.text).includes(word)),
  );
}
export function searchExcerpt(text: string, query: string): string {
  const normalized = normalizeSearch(text);
  const first = Math.min(
    ...searchWords(query)
      .map((word) => normalized.indexOf(word))
      .filter((i) => i >= 0),
  );
  const start = Number.isFinite(first) ? Math.max(0, first - 65) : 0;
  return `${start ? "…" : ""}${text.slice(start, start + 240)}${start + 240 < text.length ? "…" : ""}`;
}
