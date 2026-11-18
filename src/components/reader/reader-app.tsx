"use client";

import * as React from "react";
import { BookOpen, Compass, ListTree } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppSidebar, Ornament } from "@/components/reader/app-sidebar";
import { SectionView } from "@/components/reader/blocks";
import { ThemeToggle } from "@/components/reader/theme-toggle";
import { renderInline } from "@/components/reader/inline";
import type { BookData, LayerId, TermDef } from "@/lib/types";

const LAYERS: { id: LayerId; label: string; icon: typeof BookOpen; hint: string }[] = [
  { id: "book", label: "Книга", icon: BookOpen, hint: "оригинальный текст (пересказ)" },
  { id: "razbor", label: "Разбор", icon: ListTree, hint: "тезисы и ключевые мысли" },
  { id: "atlas", label: "Атлас", icon: Compass, hint: "шкалы, схемы, карточки" },
];

export function ReaderApp({ book }: { book: BookData }) {
  const [layer, setLayer] = React.useState<LayerId>("razbor");
  const [activeSection, setActiveSection] = React.useState<string>("");
  const [progress, setProgress] = React.useState(0);

  const terms = React.useMemo<Record<string, TermDef>>(
    () => Object.fromEntries(book.terms.map((t) => [t.id, t])),
    [book],
  );

  const chapter = React.useMemo(() => book.chapters.find((c) => !c.wip) ?? book.chapters[0], [book]);

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

  /* Scroll-spy: подсветка текущего раздела в оглавлении */
  React.useEffect(() => {
    const els = chapter.sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (els.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { rootMargin: "-25% 0px -65% 0px", threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [chapter]);

  const activeLayer = LAYERS.find((l) => l.id === layer)!;

  return (
    <SidebarProvider>
      <AppSidebar book={book} activeSection={activeSection} />

      <SidebarInset className="paper-bg flex flex-col min-h-svh">
        {/* Шапка */}
        <header className="sticky top-0 z-30 relative flex h-14 flex-none items-center gap-2 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70 px-3 md:px-4">
          <SidebarTrigger aria-label="Показать или скрыть оглавление" />
          <Separator orientation="vertical" className="h-5" />
          <span className="hidden md:block text-sm font-bold truncate max-w-[280px]">
            {book.meta.titleRu} <span className="text-muted-foreground font-normal">·</span> {chapter.title}
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
          <div className="mx-auto max-w-5xl px-4 md:px-8 pt-10 md:pt-14 pb-16">
            {/* Шапка главы */}
            <header className="text-center mb-10 md:mb-14">
              <span className="inline-grid place-items-center w-11 h-11 rounded-2xl bg-primary/15 text-primary mb-4">
                <Ornament className="w-6 h-6" />
              </span>
              <p className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border bg-card/70 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
                {book.meta.authorRu}
                <span className="text-foreground/50 normal-case tracking-normal">·</span>
                книга «{book.meta.titleRu}»
                <span className="font-arabic text-[15px] normal-case tracking-normal text-primary" dir="rtl" lang="ar">
                  {book.meta.titleAr}
                </span>
              </p>
              <h1 className="book-serif text-[40px] md:text-[56px] font-bold leading-[1.1] mt-4 tracking-[0.01em]">
                Золотая <em className="not-italic text-primary">середина</em>
              </h1>
              <p className="text-[15px] md:text-base text-muted-foreground max-w-2xl mx-auto mt-4 leading-relaxed">
                {chapter.subtitle}
              </p>

              {/* Легенда слоёв */}
              <div className="flex flex-wrap justify-center gap-2 mt-6" role="list" aria-label="Легенда слоёв">
                {LAYERS.map((l) => {
                  const Icon = l.icon;
                  return (
                    <span
                      key={l.id}
                      role="listitem"
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                        layer === l.id
                          ? "bg-primary/12 border-primary/40 text-primary"
                          : "bg-card/60 text-muted-foreground"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                      {l.label} — {l.hint}
                    </span>
                  );
                })}
                <span className="inline-flex items-center gap-1.5 rounded-full border-dashed border-accent-foreground/50 bg-accent/60 px-3 py-1.5 text-xs font-semibold text-accent-foreground">
                  дополнения помечены отдельно
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-4 max-w-xl mx-auto leading-relaxed">
                Один текст — три слоя восприятия. В любом слое визуальный блок можно развернуть в
                текст книги через «Свериться с книгой». Активный слой: «{activeLayer.label}».
              </p>
            </header>

            {/* Разделы */}
            {chapter.sections.map((s) => (
              <SectionView key={s.id} section={s} layer={layer} terms={terms} onSwitchLayer={setLayer} />
            ))}
          </div>
        </main>

        {/* Подвал */}
        <footer className="mt-auto border-t bg-card/40">
          <div className="mx-auto max-w-5xl px-4 md:px-8 py-8 text-center">
            <span className="inline-grid place-items-center w-9 h-9 rounded-xl bg-primary/15 text-primary mb-3">
              <Ornament className="w-5 h-5" />
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl mx-auto">
              По мотивам книги Ибн Каййима аль-Джаузиййи «аль-Фаваид»{" "}
              <span className="font-arabic text-[14px] text-primary" dir="rtl" lang="ar">
                الفوائد
              </span>
              . Слой «Книга» — адаптированный пересказ составителя, не цитаты; дополнения помечены;
              примеры поведения — иллюстративные.
            </p>
            <p className="text-[11px] text-muted-foreground/70 mt-2">
              Концепция: смысловые блоки × три слоя восприятия · MVP
            </p>
          </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
