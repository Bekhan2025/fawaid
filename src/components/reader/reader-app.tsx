"use client";

import * as React from "react";
import { BookOpen, ChevronLeft, ChevronRight, Compass, ListTree } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppSidebar, Ornament } from "@/components/reader/app-sidebar";
import { BookTextView, EntryPlaceholder, SectionView } from "@/components/reader/blocks";
import { ThemeToggle } from "@/components/reader/theme-toggle";
import { BOOK_ENTRIES_ORDERED, BOOK_TEXT } from "@/content/book";
import type { BookData, BookTextEntry, LayerId, TermDef } from "@/lib/types";

const LAYERS: { id: LayerId; label: string; icon: typeof BookOpen; hint: string }[] = [
  { id: "book", label: "Книга", icon: BookOpen, hint: "текст издания «Умма», 2013" },
  { id: "razbor", label: "Разбор", icon: ListTree, hint: "тезисы и ключевые мысли" },
  { id: "atlas", label: "Атлас", icon: Compass, hint: "шкалы, схемы, карточки" },
];

/** Запись, открытая по умолчанию: единственная с готовым разбором. */
const DEFAULT_ENTRY = "e310";

/** Порядок записей для чтения — по страницам издания (как лежит книга). */
const READING_ORDER: BookTextEntry[] = [...BOOK_ENTRIES_ORDERED].sort(
  (a, b) => a.page - b.page,
);

export function ReaderApp({ book }: { book: BookData }) {
  const [entryId, setEntryId] = React.useState<string>(DEFAULT_ENTRY);
  const [layer, setLayer] = React.useState<LayerId>("book");
  const [progress, setProgress] = React.useState(0);

  const terms = React.useMemo<Record<string, TermDef>>(
    () => Object.fromEntries(book.terms.map((t) => [t.id, t])),
    [book],
  );

  const entry = BOOK_TEXT[entryId] ?? READING_ORDER[0];
  const idx = READING_ORDER.findIndex((e) => e.id === entry.id);
  const prevEntry = idx > 0 ? READING_ORDER[idx - 1] : undefined;
  const nextEntry = idx < READING_ORDER.length - 1 ? READING_ORDER[idx + 1] : undefined;
  const chapter = entry.chapterId
    ? book.chapters.find((c) => c.id === entry.chapterId)
    : undefined;

  const openEntry = React.useCallback((id: string) => {
    setEntryId(id);
    setLayer("book");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const go = (id?: string) => {
    if (!id) return;
    openEntry(id);
  };

  /* Прогресс чтения */
  React.useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? h.scrollTop / max : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Переключение записей стрелками клавиатуры */
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowLeft") go(prevEntry?.id);
      if (e.key === "ArrowRight") go(nextEntry?.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevEntry, nextEntry]);

  const activeLayer = LAYERS.find((l) => l.id === layer)!;
  const pagesLabel =
    entry.pageEnd > entry.page ? `стр. ${entry.page}–${entry.pageEnd} издания` : `стр. ${entry.page} издания`;

  return (
    <SidebarProvider>
      <AppSidebar book={book} activeEntryId={entry.id} onSelectEntry={openEntry} />

      <SidebarInset className="paper-bg flex flex-col min-h-svh">
        {/* Шапка */}
        <header className="sticky top-0 z-30 relative flex h-14 flex-none items-center gap-2 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70 px-3 md:px-4">
          <SidebarTrigger aria-label="Показать или скрыть оглавление" />
          <Separator orientation="vertical" className="h-5" />
          <span className="hidden md:block text-sm font-bold truncate max-w-[300px]">
            {book.meta.titleRu}{" "}
            <span className="text-muted-foreground font-normal">
              · {entry.partNum}. {entry.partLabel}
            </span>
          </span>

          {/* Переключатель слоёв */}
          <Tabs value={layer} onValueChange={(v) => setLayer(v as LayerId)} className="ml-auto">
            <TabsList className="h-9 bg-card/70 border p-1" aria-label="Слой отображения">
              {LAYERS.map((l) => {
                const Icon = l.icon;
                return (
                  <TabsTrigger
                    key={l.id}
                    value={l.id}
                    className="gap-1.5 px-2.5 sm:px-3.5 text-[13px] font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    aria-label={`Слой «${l.label}»: ${l.hint}`}
                    title={l.hint}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden sm:inline">{l.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          <ThemeToggle />

          {/* Прогресс чтения */}
          <div
            className="absolute bottom-0 left-0 h-[2.5px] bg-primary transition-[width] duration-150 ease-out"
            style={{ width: `${progress * 100}%` }}
            aria-hidden="true"
          />
        </header>

        {/* Контент */}
        <main className="flex-1 w-full">
          <div className="mx-auto max-w-[44rem] px-4 md:px-8 pt-10 md:pt-14 pb-16">
            {/* Шапка записи */}
            <header className="mb-9 md:mb-11">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                <span className="text-primary">
                  {entry.partNum}. {entry.partLabel}
                </span>
                <span aria-hidden="true">·</span>
                <span>{pagesLabel}</span>
                {chapter ? (
                  <span className="rounded bg-primary text-primary-foreground px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide normal-case">
                    разбор готов
                  </span>
                ) : null}
              </div>
              <h1 className="book-serif text-[28px] md:text-[36px] font-bold leading-[1.18] mt-3">
                {entry.title}
              </h1>
              <div className="mt-3 flex items-center gap-2 text-[13px] text-muted-foreground">
                <Ornament className="w-4 h-4 text-primary/70" aria-hidden="true" />
                <span>
                  {book.meta.authorRu} · «{book.meta.titleRu}»{" "}
                  <span className="font-arabic text-[14px] text-primary/90" dir="rtl" lang="ar">
                    {book.meta.titleAr}
                  </span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground/80 mt-2">
                Активный слой: «{activeLayer.label}» — {activeLayer.hint}. Листать записи: ← / →.
              </p>
            </header>

            {/* Тело по слоям */}
            {layer === "book" ? (
              <article aria-label="Текст книги">
                <BookTextView entry={entry} />
              </article>
            ) : chapter ? (
              <div aria-label={layer === "razbor" ? "Разбор записи" : "Атлас записи"}>
                {chapter.sections.map((s) => (
                  <SectionView key={s.id} section={s} layer={layer} terms={terms} />
                ))}
              </div>
            ) : (
              <EntryPlaceholder layer={layer} onSwitchLayer={setLayer} />
            )}

            {/* Навигация по записям */}
            <nav className="mt-12 pt-6 border-t flex items-stretch gap-3" aria-label="Навигация по записям книги">
              <button
                type="button"
                onClick={() => go(prevEntry?.id)}
                disabled={!prevEntry}
                className="group flex-1 min-w-0 flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left transition-colors hover:bg-muted/60 disabled:opacity-40 disabled:pointer-events-none"
                aria-label={prevEntry ? `Предыдущая запись: ${prevEntry.title}` : "Предыдущей записи нет"}
              >
                <ChevronLeft className="flex-none w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground">
                    Предыдущая
                  </span>
                  <span className="block truncate text-[13px] font-semibold mt-0.5">
                    {prevEntry ? prevEntry.title : "—"}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => go(nextEntry?.id)}
                disabled={!nextEntry}
                className="group flex-1 min-w-0 flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-right transition-colors hover:bg-muted/60 disabled:opacity-40 disabled:pointer-events-none"
                aria-label={nextEntry ? `Следующая запись: ${nextEntry.title}` : "Следующей записи нет"}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground">
                    Следующая
                  </span>
                  <span className="block truncate text-[13px] font-semibold mt-0.5">
                    {nextEntry ? nextEntry.title : "—"}
                  </span>
                </span>
                <ChevronRight className="flex-none w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
              </button>
            </nav>
          </div>
        </main>

        {/* Подвал */}
        <footer className="mt-auto border-t bg-card/40">
          <div className="mx-auto max-w-[44rem] px-4 md:px-8 py-8 text-center">
            <span className="inline-grid place-items-center w-9 h-9 rounded-xl bg-primary/15 text-primary mb-3">
              <Ornament className="w-5 h-5" />
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Ибн Каййим аль-Джаузиййа, «аль-Фаваид»{" "}
              <span className="font-arabic text-[14px] text-primary" dir="rtl" lang="ar">
                الفوائد
              </span>{" "}
              · слой «Книга» — текст русского издания (М.: Умма, 2013), сноски
              сохранены; разбор и атлас — работа составителя, дополнения помечены
              пунктирной рамкой.
            </p>
            <p className="text-[11px] text-muted-foreground/70 mt-2">
              Один текст — три слоя восприятия · текст издания по 136 записям оглавления
            </p>
          </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
