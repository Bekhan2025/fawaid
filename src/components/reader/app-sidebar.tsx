"use client";

import * as React from "react";
import { BookOpenText, ChevronRight } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import type { BookData, BookEntry } from "@/lib/types";

/** Орнамент «геометрический ромб» — системный знак дизайн-системы. */
export function Ornament({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className={className}
      aria-hidden="true"
    >
      <rect x="7" y="7" width="10" height="10" />
      <rect x="7" y="7" width="10" height="10" transform="rotate(45 12 12)" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Цвет бейджа по маркеру автора («Раздел», «Польза», «Правило»…). */
const MARKER_CLASS: Record<string, string> = {
  "Раздел": "bg-primary/12 text-primary",
  "Очень полезный раздел": "bg-primary/12 text-primary",
  "Польза": "bg-emerald-600/12 text-emerald-700 dark:text-emerald-400",
  "Важная польза": "bg-emerald-600/12 text-emerald-700 dark:text-emerald-400",
  "Правило": "bg-sky-600/12 text-sky-700 dark:text-sky-400",
  "Важное правило": "bg-sky-600/12 text-sky-700 dark:text-sky-400",
  "Полезное правило": "bg-sky-600/12 text-sky-700 dark:text-sky-400",
  "Замечание": "bg-amber-600/15 text-amber-700 dark:text-amber-400",
  "Важное замечание": "bg-amber-600/15 text-amber-700 dark:text-amber-400",
  "Наставление": "bg-violet-600/12 text-violet-700 dark:text-violet-400",
  "Изречение": "bg-muted text-muted-foreground",
  "Введение": "bg-muted text-muted-foreground",
};

function MarkerBadge({ marker }: { marker: string }) {
  return (
    <span
      className={`inline-flex flex-none items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${MARKER_CLASS[marker] ?? "bg-muted text-muted-foreground"}`}
    >
      {marker}
    </span>
  );
}

export function AppSidebar({
  book,
  activeEntryId,
  onSelectEntry,
}: {
  book: BookData;
  activeEntryId: string;
  onSelectEntry: (id: string) => void;
}) {
  const { isMobile, setOpenMobile } = useSidebar();

  /* По умолчанию раскрыта часть с активной записью. */
  const activePartId = React.useMemo(
    () => book.parts.find((p) => p.entries.some((e) => e.id === activeEntryId))?.id,
    [book, activeEntryId],
  );
  const [openParts, setOpenParts] = React.useState<Set<string>>(
    () => new Set(activePartId ? [activePartId] : []),
  );
  React.useEffect(() => {
    if (activePartId) {
      setOpenParts((prev) => {
        if (prev.has(activePartId)) return prev;
        const next = new Set(prev);
        next.add(activePartId);
        return next;
      });
      // подскроллить группу и активную запись (внутри скролл-контейнера сайдбара)
      const t1 = window.setTimeout(() => {
        document
          .getElementById(`part-btn-${activePartId}`)
          ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }, 60);
      const t2 = window.setTimeout(() => {
        document
          .getElementById(`entry-btn-active`)
          ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }, 240);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }
  }, [activePartId]);

  const select = (id: string) => {
    onSelectEntry(id);
    if (isMobile) setOpenMobile(false);
  };

  const togglePart = (id: string) => {
    setOpenParts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderEntry = (entry: BookEntry) => {
    const active = entry.id === activeEntryId;
    const hasChapter = Boolean(entry.chapterId);

    return (
      <SidebarMenuItem key={entry.id}>
        <button
          type="button"
          id={active ? `entry-btn-active` : undefined}
          onClick={() => select(entry.id)}
          aria-current={active ? "true" : undefined}
          title={`${entry.marker}: ${entry.title} (с. ${entry.page})`}
          className={`flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
            active
              ? "border border-primary/40 bg-primary/10"
              : "border border-transparent hover:bg-muted/60"
          }`}
        >
          {hasChapter ? (
            <BookOpenText className="mt-0.5 h-4 w-4 flex-none text-primary" aria-hidden="true" />
          ) : (
            <span className="mt-0.5 flex-none h-4 w-4 grid place-items-center">
              <span
                className={`h-1.5 w-1.5 rotate-45 rounded-[1px] ${active ? "bg-primary" : "bg-muted-foreground/40"}`}
                aria-hidden="true"
              />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span
              className={`line-clamp-2 block text-[12.5px] leading-snug ${
                active ? "font-bold text-primary" : "font-medium text-foreground/85"
              }`}
            >
              {entry.title}
            </span>
            <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <MarkerBadge marker={entry.marker} />
              <span className="font-mono text-[10px] text-muted-foreground">
                с. {entry.page}
              </span>
              {hasChapter ? (
                <span className="rounded bg-primary text-primary-foreground px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide">
                  разбор готов
                </span>
              ) : null}
            </span>
          </span>
        </button>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon">
      {/* Книга */}
      <SidebarHeader className="p-0 pb-1">
        <div className="px-3 pt-3 pb-2 flex items-center gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <span className="flex-none w-9 h-9 grid place-items-center rounded-xl bg-primary/15 text-primary">
            <Ornament className="w-5 h-5" />
          </span>
          <div className="group-data-[collapsible=icon]:hidden min-w-0">
            <p className="font-serif font-bold text-[17px] leading-tight">
              {book.meta.titleRu}
            </p>
            <p className="font-arabic text-lg leading-none text-primary mt-0.5" dir="rtl" lang="ar">
              {book.meta.titleAr}
            </p>
          </div>
        </div>
        <p className="px-6 pb-2 text-xs text-muted-foreground leading-snug group-data-[collapsible=icon]:hidden">
          {book.meta.authorRu} · {book.meta.authorNote}
        </p>
      </SidebarHeader>

      {/* Оглавление издания: части → записи */}
      <SidebarContent className="nice-scroll">
        {book.parts.map((part) => {
          const isOpen = openParts.has(part.id);
          return (
            <SidebarGroup key={part.id} className="group-data-[collapsible=icon]:hidden py-1.5 border-b border-border/40 last:border-b-0">
              <button
                type="button"
                id={`part-btn-${part.id}`}
                onClick={() => togglePart(part.id)}
                aria-expanded={isOpen}
                aria-label={`Часть ${part.num}: ${part.label} — ${part.entries.length} записей`}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-primary"
              >
                <span className="flex-none w-7 text-center font-serif text-[12px] font-bold text-primary/75">
                  {part.num}
                </span>
                <span className="min-w-0 flex-1 truncate text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
                  {part.label}
                </span>
                <span className="flex-none text-[10px] font-semibold text-muted-foreground/50">
                  {part.entries.length}
                </span>
                <ChevronRight
                  className={`flex-none h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                  aria-hidden="true"
                />
              </button>
              {isOpen && (
                <SidebarGroupContent>
                  <SidebarMenu>{part.entries.map(renderEntry)}</SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <div className="rounded-lg border bg-muted/40 px-3 py-2.5 mx-2 mb-2">
          <p className="text-[11px] font-bold">Текст издания</p>
          <p className="text-[10.5px] text-muted-foreground leading-snug mt-0.5">
            «Умма», 2013 · 480 с. Слой «Книга» — полный текст по всем 136
            записям оглавления; автор не делил книгу на главы, тематические
            части составлены для навигации.
          </p>
          <p className="text-[10.5px] text-muted-foreground leading-snug mt-1">
            Разбор и атлас пока готовы для «Золотой середины» — остальные по
            мере работы.
          </p>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
