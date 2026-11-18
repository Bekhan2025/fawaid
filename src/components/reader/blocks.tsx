"use client";

import * as React from "react";
import { BookOpen, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BookTextEntry, LayerId, Section, TermDef } from "@/lib/types";
import { renderInline } from "@/components/reader/inline";
import { AtlasRenderer } from "@/components/reader/atlas";

/* ============ Инлайн-фрагменты книжного текста ============ */

/** Разбивает строку на части по маркерам сносок {{n}} и символу ﷺ. */
function renderBookInline(
  text: string,
  footnotes: BookTextEntry["footnotes"],
  fnRef: (n: number) => React.ReactNode,
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /\{\{(\d+)\}\}|\uFDFA/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1]) {
      const n = Number(m[1]);
      nodes.push(
        <React.Fragment key={key++}>{fnRef(n)}</React.Fragment>,
      );
    } else {
      nodes.push(
        <span key={key++} className="salla" lang="ar" aria-label="да благословит его Аллах и приветствует">
          ﷺ
        </span>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/* ============ Слой «Книга»: текст издания ============ */

export function BookTextView({ entry }: { entry: BookTextEntry }) {
  const fnRef = (n: number) => <span className="book-fnref">{n}</span>;

  // красная строка: у первого абзаца её нет (как в книге после заголовка),
  // и после центрированных/стихотворных вставок
  const paras: React.ReactNode[] = [];
  let flatNext = true;
  const items = entry.paragraphs;
  for (let i = 0; i < items.length; i++) {
    const p = items[i];
    if (typeof p === "string") {
      const cls = flatNext ? "bp-flat" : "bp";
      flatNext = false;
      paras.push(
        <p key={i} className={cls}>
          {renderBookInline(p, entry.footnotes, fnRef)}
        </p>,
      );
      continue;
    }
    if ("verse" in p) {
      flatNext = true;
      paras.push(
        <blockquote key={i} className="bp-verse">
          {p.verse.map((line, j) => (
            <span key={j}>{line}</span>
          ))}
        </blockquote>,
      );
      continue;
    }
    flatNext = true;
    paras.push(
      <p key={i} className="bp-center">
        {p.center}
      </p>,
    );
  }

  return (
    <div className="book-page animate-rise">
      {paras}
      {entry.footnotes.length > 0 && (
        <div className="book-footnotes" aria-label="Сноски издания">
          <ol>
            {entry.footnotes.map((f) => (
              <li key={f.n} id={`fn-${f.n}`}>
                <span className="fn-n">{f.n}</span>
                {renderBookInline(f.text, entry.footnotes, fnRef)}
              </li>
            ))}
          </ol>
        </div>
      )}
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
      <BookOpen className="w-3.5 h-3.5 flex-none" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

/** Заглушка для слоёв «Разбор»/«Атлас» у ещё не разобранных записей. */
export function EntryPlaceholder({
  layer,
  onSwitchLayer,
}: {
  layer: "razbor" | "atlas";
  onSwitchLayer: (l: LayerId) => void;
}) {
  return (
    <div className="addition-box p-5 animate-rise">
      <div className="flex items-start gap-3">
        <Layers className="w-5 h-5 mt-0.5 flex-none text-accent-foreground" aria-hidden="true" />
        <div className="flex-1">
          <Badge variant="outline" className="bg-card/60 border-accent-foreground/40 text-accent-foreground font-bold">
            {layer === "razbor" ? "Разбор в подготовке" : "Атлас в подготовке"}
          </Badge>
          <p className="text-[14px] leading-relaxed mt-2.5 text-foreground/85">
            Текст книги для этой записи уже здесь — переключитесь на слой
            «Книга». Тематический разбор и визуальные схемы появятся
            по мере работы над главами.
          </p>
          <button
            type="button"
            onClick={() => onSwitchLayer("book")}
            className="mt-3.5 inline-flex items-center gap-2 rounded-md border border-accent-foreground/40 px-3 py-1.5 text-[13px] font-semibold text-accent-foreground transition-colors hover:bg-accent-foreground/10"
          >
            <BookOpen className="w-4 h-4" aria-hidden="true" />
            Читать текст книги
          </button>
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

/* ============ Секция разбора (для готовых глав) ============ */

export function SectionView({
  section,
  layer,
  terms,
}: {
  section: Section;
  layer: "razbor" | "atlas";
  terms: Record<string, TermDef>;
}) {
  const { razbor, atlas } = section;

  let body: React.ReactNode = null;
  if (layer === "razbor") {
    body = razbor ? (
      <RazborBlock section={section} terms={terms} />
    ) : (
      <NoteChip>Разбор этого раздела готовится</NoteChip>
    );
  } else {
    body = atlas ? (
      <AtlasRenderer atlas={atlas} terms={terms} />
    ) : razbor ? (
      <div className="space-y-4">
        <NoteChip>Визуальная форма для этого раздела готовится — показан разбор</NoteChip>
        <RazborBlock section={section} terms={terms} />
      </div>
    ) : (
      <NoteChip>Визуальная форма готовится</NoteChip>
    );
  }

  if (section.additionOnly) {
    body = <AdditionWrapper>{body}</AdditionWrapper>;
  }

  return (
    <section id={section.id} className="scroll-mt-24 py-8 md:py-10 border-t first:border-t-0 first:pt-0" aria-labelledby={`${section.id}-title`}>
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
        <h2 id={`${section.id}-title`} className="book-serif text-[24px] md:text-[28px] font-bold leading-tight">
          {section.title}
        </h2>
        {section.lead ? (
          <p className="text-[15px] text-muted-foreground mt-2.5 leading-relaxed">{section.lead}</p>
        ) : null}
      </header>

      {body}
    </section>
  );
}
