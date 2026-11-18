"use client";

import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { TermDef } from "@/lib/types";

/** Терминовый бейдж в тексте: клик открывает карточку с пояснением. */
export function TermBadge({ term }: { term: TermDef }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="term-badge" aria-label={`Термин: ${term.ru}`}>
          {term.ru}
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="center" className="w-80 p-4" sideOffset={8}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-bold text-[15px] leading-tight">{term.ru}</p>
            {term.translit ? (
              <p className="text-xs text-muted-foreground mt-0.5">{term.translit}</p>
            ) : null}
          </div>
          {term.ar ? (
            <span className="font-arabic text-2xl leading-none text-primary" dir="rtl" lang="ar">
              {term.ar}
            </span>
          ) : null}
        </div>
        <p className="text-sm font-semibold mt-3">{term.short}</p>
        <p className="text-[13px] text-muted-foreground leading-relaxed mt-1">{term.note}</p>
      </PopoverContent>
    </Popover>
  );
}

const INLINE_SPLIT = /(\[\[term:[a-z0-9-]+\]\]|\*\*[^*]+\*\*)/g;

/**
 * Инлайн-разметка: **жирный** и [[term:id]] → React-узлы.
 */
export function renderInline(
  text: string,
  terms: Record<string, TermDef>,
): React.ReactNode[] {
  return text.split(INLINE_SPLIT).map((part, i) => {
    if (!part) return null;
    const termMatch = /^\[\[term:([a-z0-9-]+)\]\]$/.exec(part);
    if (termMatch) {
      const term = terms[termMatch[1]];
      if (!term) return null;
      return <TermBadge key={i} term={term} />;
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-extrabold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}
