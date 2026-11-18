"use client";

import * as React from "react";
import { BookOpen, ChevronDown, Info, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { LayerId, Section, TermDef } from "@/lib/types";
import { renderInline } from "@/components/reader/inline";
import { AtlasRenderer } from "@/components/reader/atlas";

/* ============ Слой «Книга» ============ */

export function BookBlock({
  section,
  terms,
}: {
  section: Section;
  terms: Record<string, TermDef>;
}) {
  if (!section.book) return null;
  return (
    <div className="animate-rise">
      {section.book.label ? (
        <p className="text-xs uppercase tracking-[0.12em] font-bold text-muted-foreground mb-4">
          {section.book.label}
        </p>
      ) : null}
      <div className="book-serif text-[17px] md:text-[18.5px] leading-[1.85] space-y-5 text-foreground/90">
        {section.book.paragraphs.map((p, i) => (
          <p
            key={i}
            className={i === 0 ? "first-letter:text-[3.2em] first-letter:font-bold first-letter:text-primary first-letter:mr-2 first-letter:float-left first-letter:leading-[0.85] first-letter:mt-1" : ""}
          >
            {renderInline(p, terms)}
          </p>
        ))}
      </div>
    </div>
  );
}

/* ============ Слой «Разбор» ============ */

export function RazborBlock({
  section,
  terms,
}: {
  section: Section;
  terms: Record<string, TermDef>;
}) {
  if (!section.razbor) return null;
  const r = section.razbor;
  return (
    <div className="animate-rise space-y-5">
      {r.keyIdea ? (
        <div className="rounded-xl border-l-4 border-primary bg-primary/10 px-4 py-3.5">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-primary mb-1">
            Ключевая мысль
          </p>
          <p className="text-[15px] font-semibold leading-relaxed">{renderInline(r.keyIdea, terms)}</p>
        </div>
      ) : null}

      <div className="space-y-4 text-[15px] leading-[1.8] text-foreground/90 max-w-3xl">
        {r.paragraphs.map((p, i) => (
          <p key={i}>{renderInline(p, terms)}</p>
        ))}
      </div>

      {r.list ? (
        <ul className="space-y-2.5 max-w-3xl">
          {r.list.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-[14px] leading-relaxed">
              <span className="mt-[9px] flex-none w-2 h-2 rotate-45 bg-primary/70 rounded-[2px]" aria-hidden="true" />
              <span>{renderInline(item, terms)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/* ============ Вспомогательные элементы ============ */

function NoteChip({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
      <Info className="w-3.5 h-3.5 flex-none" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

/** Разворачивающийся оригинал: «свериться с книгой». */
function BookPeek({ section, terms }: { section: Section; terms: Record<string, TermDef> }) {
  if (!section.book) return null;
  return (
    <Collapsible className="mt-6">
      <CollapsibleTrigger className="group inline-flex items-center gap-2 text-[13px] font-semibold text-primary hover:text-primary/85 transition-colors">
        <BookOpen className="w-4 h-4" aria-hidden="true" />
        Свериться с книгой — оригинальный текст
        <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-3 rounded-xl border bg-muted/40 px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground mb-2.5">
            Слой «Книга» · пересказ
          </p>
          <div className="book-serif text-[15.5px] leading-[1.8] text-foreground/80 space-y-3">
            {section.book.paragraphs.map((p, i) => (
              <p key={i}>{renderInline(p, terms)}</p>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Уведомление в слое «Книга» для разделов-дополнений. */
function AdditionNotice({ onSwitchLayer }: { onSwitchLayer: (l: LayerId) => void }) {
  return (
    <div className="addition-box p-5 animate-rise">
      <div className="flex items-start gap-3">
        <Layers className="w-5 h-5 mt-0.5 flex-none text-accent-foreground" aria-hidden="true" />
        <div className="flex-1">
          <Badge variant="outline" className="bg-card/60 border-accent-foreground/40 text-accent-foreground font-bold">
            Дополнение составителя
          </Badge>
          <p className="text-[14px] leading-relaxed mt-2.5 text-foreground/85">
            В книге «аль-Фаваид» такого раздела нет: это дополнение составителя — перенос смыслов
            главы в контекст XXI века. В слое «Книга» показан только оригинальный материал.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3.5 border-accent-foreground/40 text-accent-foreground hover:bg-accent-foreground/10"
            onClick={() => onSwitchLayer("razbor")}
          >
            Показать разбор
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Обёртка дополнения для слоёв «Разбор»/«Атлас». */
function AdditionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="addition-box p-4 md:p-5 animate-rise">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline" className="bg-card/60 border-accent-foreground/40 text-accent-foreground font-bold">
          Дополнение составителя
        </Badge>
        <span className="text-xs text-muted-foreground">этого раздела нет в книге</span>
      </div>
      {children}
    </div>
  );
}

/* ============ Секция целиком ============ */

export function SectionView({
  section,
  layer,
  terms,
  onSwitchLayer,
}: {
  section: Section;
  layer: LayerId;
  terms: Record<string, TermDef>;
  onSwitchLayer: (l: LayerId) => void;
}) {
  const { book, razbor, atlas } = section;

  let body: React.ReactNode = null;

  if (layer === "book") {
    if (book) {
      body = <BookBlock section={section} terms={terms} />;
    } else if (section.additionOnly) {
      body = <AdditionNotice onSwitchLayer={onSwitchLayer} />;
    } else if (razbor) {
      body = (
        <div className="space-y-4">
          <NoteChip>Текст книги для этого фрагмента готовится — показан разбор</NoteChip>
          <RazborBlock section={section} terms={terms} />
        </div>
      );
    }
  } else if (layer === "razbor") {
    if (razbor) {
      body = <RazborBlock section={section} terms={terms} />;
    } else if (book) {
      body = (
        <div className="space-y-4">
          <NoteChip>Разбор для этого фрагмента готовится — показан текст книги</NoteChip>
          <BookBlock section={section} terms={terms} />
        </div>
      );
    }
  } else if (layer === "atlas") {
    if (atlas) {
      body = <AtlasRenderer atlas={atlas} terms={terms} />;
    } else if (razbor) {
      body = (
        <div className="space-y-4">
          <NoteChip>Визуальная форма для этого фрагмента готовится — показан разбор</NoteChip>
          <RazborBlock section={section} terms={terms} />
        </div>
      );
    } else if (book) {
      body = (
        <div className="space-y-4">
          <NoteChip>Визуальная форма готовится — показан текст книги</NoteChip>
          <BookBlock section={section} terms={terms} />
        </div>
      );
    }
  }

  // Дополнения-разделы в слоях «Разбор»/«Атлас» оборачиваются рамкой
  if (section.additionOnly && layer !== "book" && body) {
    body = <AdditionWrapper>{body}</AdditionWrapper>;
  }

  return (
    <section id={section.id} className="scroll-mt-24 py-10 md:py-12 border-t first:border-t-0" aria-labelledby={`${section.id}-title`}>
      <header className="mb-6 max-w-3xl">
        <div className="flex items-center gap-3 mb-2.5">
          <span className="inline-grid place-items-center min-w-9 h-9 px-2.5 rounded-full bg-primary/12 text-primary font-extrabold text-[13px] tracking-wide">
            {section.num}
          </span>
          {section.additionOnly ? (
            <Badge
              variant="outline"
              className="border-dashed border-accent-foreground/50 text-accent-foreground bg-accent/60 font-bold"
            >
              Дополнение
            </Badge>
          ) : (
            <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-muted-foreground">
              Раздел {section.num}
            </span>
          )}
        </div>
        <h2 id={`${section.id}-title`} className="book-serif text-[26px] md:text-[30px] font-bold leading-tight">
          {section.title}
        </h2>
        {section.lead ? (
          <p className="text-[15px] text-muted-foreground mt-2.5 leading-relaxed">{section.lead}</p>
        ) : null}
      </header>

      {body}

      {layer !== "book" && section.book && body && !section.additionOnly ? (
        <BookPeek section={section} terms={terms} />
      ) : null}
    </section>
  );
}
