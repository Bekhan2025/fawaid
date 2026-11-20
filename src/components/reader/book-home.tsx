"use client";

import * as React from "react";
import { BOOK, BOOK_ENTRIES_ORDERED } from "@/content/book";
import { readSavedReadingLocation } from "@/hooks/use-reading-location";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

const firstEntry = [...BOOK_ENTRIES_ORDERED].sort((a, b) => a.page - b.page)[0];
const root = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/`;

export function BookHome() {
  const [saved, setSaved] = React.useState<ReturnType<typeof readSavedReadingLocation>>(null);
  React.useEffect(() => {
    setSaved(readSavedReadingLocation());
  }, []);

  return (
    <div className="paper-bg min-h-svh flex flex-col">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-5 sm:px-10 sm:py-7">
        <span className="text-xs sm:text-sm text-muted-foreground">Ибн Каййим аль-Джаузиййа</span>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pb-12 pt-10 text-center sm:px-10 sm:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-muted-foreground sm:text-xs">Книга</p>
        <h1 className="book-serif mt-5 text-[clamp(2.5rem,8.5vw,7rem)] font-medium leading-[1.1] tracking-[-0.04em]">АЛЬ-ФАВАИД</h1>
        <p className="book-serif mt-5 text-2xl italic text-primary sm:mt-6 sm:text-4xl">Полезные наставления</p>

        <div className="mx-auto mt-10 h-px w-16 bg-primary/40 sm:mt-14" aria-hidden="true" />

        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-7 sm:mt-14 lg:grid-cols-4 lg:gap-0">
          {["Читай", "Размышляй", "Действуй", "Распространяй"].map((word, index) => (
            <div key={word} className={index > 0 ? "lg:border-l lg:border-border" : ""}>
              <h2 className="book-serif text-[clamp(1.1rem,4.5vw,1.75rem)] font-medium leading-snug">{word}</h2>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:mt-14 sm:flex-row">
          <Button asChild size="lg" className="h-12 w-full max-w-64 rounded-full px-8 sm:w-auto">
            <a href={`${root}?entry=${firstEntry.id}&layer=book`}>Начать чтение</a>
          </Button>
          {saved && (
            <Button asChild variant="outline" size="lg" className="h-12 w-full max-w-64 rounded-full px-8 sm:w-auto">
              <a href={`${root}?entry=${saved.entryId}&layer=${saved.layer}${saved.target ? `#${saved.target}` : ""}`}>Продолжить чтение</a>
            </Button>
          )}
        </div>
      </main>

      <footer className="mx-6 border-t border-border px-2 py-6 text-center text-[11px] leading-relaxed text-muted-foreground sm:mx-10 sm:text-xs">
        Текст книги · Разбор · Атлас
        <span className="mx-2" aria-hidden="true">·</span>
        {BOOK.meta.authorRu}
      </footer>
    </div>
  );
}
