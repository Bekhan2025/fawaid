/**
 * Модель данных многослойной читалки «аль-Фаваид».
 *
 * Атомарная единица — смысловой блок (Section). Один и тот же блок
 * существует в нескольких представлениях-слоях: «Книга» (пересказ),
 * «Разбор» (структура), «Атлас» (визуализация).
 *
 * Инлайн-разметка в текстах:
 *   **жирный**        — выделение ключевой мысли
 *   [[term:term-id]]  — вставка терминовой карточки (TermBadge)
 */

export type LayerId = "book" | "razbor" | "atlas";

/** Виды визуальных примитивов слоя «Атлас». */
export type AtlasKind =
  | "mini"
  | "spectrum"
  | "examples"
  | "steps"
  | "cards"
  | "chain"
  | "cases"
  | "conditions"
  | "comparison"
  | "branching"
  | "correspondence"
  | "relations";

/** Цветовые «классы» точек шкалы: k2 — середина, k1/k3 — умеренные, k0/k4 — крайности. */
export type ScaleKind = "k0" | "k1" | "k2" | "k3" | "k4";

export interface TermDef {
  id: string;
  /** Название по-русски (текст бейджа). */
  ru: string;
  /** Арабское написание. */
  ar?: string;
  /** Транслитерация. */
  translit?: string;
  /** Краткое значение — одна строка. */
  short: string;
  /** Пояснение в карточке. */
  note: string;
}

export interface MiniMarker {
  /** Позиция в процентах 0..100 по градиентной шкале. */
  pos: number;
  value: string;
  kind: ScaleKind;
  title: string;
  sub?: string;
}

export interface SpectrumCell {
  kind: ScaleKind;
  chip: string;
  text: string;
}

export interface SpectrumRow {
  id: string;
  title: string;
  en: string;
  /** Подпись «между чем стоит качество». */
  note: string;
  /** Ключ иконки lucide (см. ICONS в atlas.tsx). */
  icon: string;
  /** Базовый цвет качества. */
  color: string;
  cells: SpectrumCell[];
}

export interface ExampleCard {
  id: string;
  quality: string;
  /** Современный триггер. */
  trigger: string;
  /** Крайность −5 в современных условиях. */
  minus: string;
  /** Середина 0. */
  zero: string;
  /** Крайность +5. */
  plus: string;
}

export interface StepCard {
  id: string;
  title: string;
  text: string;
  icon: string;
}

export interface Section {
  id: string;
  num: string;
  title: string;
  lead?: string;
  /** Раздел целиком является дополнением составителя. */
  additionOnly?: boolean;
  /** Дословные опорные фрагменты из неизменяемого текста; доступны в обоих слоях. */
  evidence?: { label: string; entryId: string; paragraphs: number[] }[];
  /** Слой «Книга»: адаптированный пересказ. */
  book?: {
    label?: string;
    paragraphs: string[];
  };
  /** Слой «Разбор»: структурированные тезисы. */
  razbor?: {
    keyIdea?: string;
    paragraphs: string[];
    list?: string[];
  };
  /** Слой «Атлас»: визуальный примитив. */
  atlas?:
    | {kind:"relations"; pairs:{id:string;left:string;right:string;relation:string}[]; caption?:string}
    | { kind: "correspondence"; rows: {id:string; reference:string; concept:string; text:string}[]; caption?:string }
    | {
        kind: "branching";
        root: { title: string; text: string };
        branches: {
          id: string;
          title: string;
          nodes: { id: string; title: string; text: string }[];
        }[];
        caption?: string;
      }
    | {
        kind: "conditions";
        items: { id: string; role: string; title: string; text: string }[];
        result: string;
        caption?: string;
      }
    | {
        kind: "comparison";
        columns: [string, string];
        rows: { id: string; aspect: string; left: string; right: string }[];
        caption?: string;
      }
    | {
        kind: "cases";
        question: string;
        cases: {
          id: string;
          condition: string;
          outcomes: { condition?: string; text: string }[];
        }[];
        caption?: string;
      }
    | { kind: "mini"; markers: MiniMarker[]; caption?: string }
    | { kind: "spectrum"; rows: SpectrumRow[]; caption?: string }
    | { kind: "examples"; cards: ExampleCard[]; caption?: string }
    | { kind: "steps"; steps: StepCard[]; caption?: string }
    | {
        kind: "cards" | "chain";
        cards: { id: string; title: string; text: string }[];
        caption?: string;
      };
}

export interface Chapter {
  id: string;
  num: string;
  title: string;
  subtitle: string;
  /** Раздел ещё в работе — показывается как заглушка в навигации. */
  wip?: boolean;
  sections: Section[];
}

/**
 * Запись оглавления издания: одна «польза»/«раздел»/«правило» книги.
 * Пока запись не разобрана, она ведёт себя как заглушка в навигации.
 */
export interface BookEntry {
  /** e310 — по номеру страницы издания. */
  id: string;
  /** Страница издания (Умма, 2013). */
  page: number;
  /** Маркер автора: «Раздел», «Польза», «Правило», «Замечание»… */
  marker: string;
  /** Заголовок из оглавления издания. */
  title: string;
  /** Ссылка на готовую главу с контентом. */
  chapterId?: string;
}

/**
 * Тематическая часть навигации. Сам автор книгу на главы не делил —
 * это редакторская группировка записей оглавления для читалки.
 */
export interface BookPart {
  id: string;
  /** Римская цифра части. */
  num: string;
  label: string;
  entries: BookEntry[];
}

export interface BookMeta {
  titleRu: string;
  titleAr: string;
  authorRu: string;
  authorAr: string;
  authorNote: string;
}

/**
 * Абзац слоя «Книга» — текст издания (Умма, 2013).
 * Строка — обычный абзац; {{n}} — маркер сноски.
 * Объекты — стихотворная цитата (по строкам) или центрированный текст (басмала).
 */
export type BookPara = string | { verse: string[] } | { center: string };

/** Запись книги с полным текстом издания (генерируется scripts/extract_book.py). */
export interface BookTextEntry {
  id: string;
  marker: string;
  title: string;
  /** Первая страница издания. */
  page: number;
  /** Последняя страница издания. */
  pageEnd: number;
  partNum: string;
  partLabel: string;
  /** Ссылка на готовую главу разбора, если есть. */
  chapterId: string | null;
  paragraphs: BookPara[];
  /** Сноски издания: сквозная нумерация. */
  footnotes: { n: number; text: string }[];
}

export interface BookData {
  meta: BookMeta;
  /** Словарь терминов для бейджей [[term:id]]. */
  terms: TermDef[];
  /** Навигация: тематические части → записи оглавления издания. */
  parts: BookPart[];
  /** Готовые главы с контентом (привязаны к записям через chapterId). */
  chapters: Chapter[];
}
