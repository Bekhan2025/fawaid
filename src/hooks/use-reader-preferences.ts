"use client";
import * as React from "react";
import { BOOK_TEXT } from "@/content/book";
export interface Bookmark {
  entryId: string;
  paragraph: number;
}
export interface ReaderPreferences {
  size: number;
  spacing: number;
  bookmarks: Bookmark[];
}
const DEFAULTS: ReaderPreferences = { size: 18, spacing: 1.72, bookmarks: [] };
export function useReaderPreferences() {
  const [preferences, setPreferences] = React.useState(DEFAULTS);
  const [ready, setReady] = React.useState(false);
  const [storageError, setStorageError] = React.useState(false);
  React.useEffect(() => {
    try {
      const raw = JSON.parse(
        localStorage.getItem("fawaid:preferences:v1") ?? "null",
      );
      if (raw && typeof raw === "object")
        setPreferences({
          size: [16, 18, 20, 22, 24].includes(raw.size) ? raw.size : 18,
          spacing: [1.5, 1.72, 2].includes(raw.spacing) ? raw.spacing : 1.72,
          bookmarks: Array.isArray(raw.bookmarks)
            ? raw.bookmarks.filter(
                (b: Bookmark) =>
                  b &&
                  Object.hasOwn(BOOK_TEXT, b.entryId) &&
                  Number.isInteger(b.paragraph) &&
                  b.paragraph >= 0 &&
                  b.paragraph < BOOK_TEXT[b.entryId].paragraphs.length,
              )
            : [],
        });
    } catch {
      setStorageError(true);
    }
    setReady(true);
  }, []);
  React.useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(
        "fawaid:preferences:v1",
        JSON.stringify(preferences),
      );
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [preferences, ready]);
  const update = React.useCallback(
    (change: (p: ReaderPreferences) => ReaderPreferences) => {
      setPreferences(change);
    },
    [],
  );
  const toggleBookmark = (entryId: string, paragraph: number) =>
    update((p) => ({
      ...p,
      bookmarks: p.bookmarks.some(
        (b) => b.entryId === entryId && b.paragraph === paragraph,
      )
        ? p.bookmarks.filter(
            (b) => b.entryId !== entryId || b.paragraph !== paragraph,
          )
        : [...p.bookmarks, { entryId, paragraph }],
    }));
  return { preferences, ready, storageError, update, toggleBookmark };
}
