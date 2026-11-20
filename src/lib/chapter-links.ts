import type { BookPart, BookTextEntry } from './types';
export function applyChapterLinks(parts: BookPart[], texts: BookTextEntry[], links: Record<string,string>): {parts: BookPart[]; texts: BookTextEntry[]} {
  return {
    parts: parts.map(part=>({...part,entries:part.entries.map(entry=>({...entry,chapterId:links[entry.id]}))})),
    texts: texts.map(entry=>({...entry,chapterId:links[entry.id] ?? null})),
  };
}
