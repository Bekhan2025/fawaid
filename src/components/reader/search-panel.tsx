"use client";
import * as React from "react";
import { Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BOOK, BOOK_ENTRIES_ORDERED } from "@/content/book";
import {
  buildSearchIndex,
  searchIndex,
  searchExcerpt,
  type SearchScope,
} from "@/lib/book-search";

export default function SearchPanel({
  onOpenEntry,
}: {
  onOpenEntry: (id: string, target?: string) => void;
}) {
  const selecting = React.useRef(false);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const deferred = React.useDeferredValue(query);
  const [scope, setScope] = React.useState<SearchScope>("all");
  const [limit, setLimit] = React.useState(30);
  const index = React.useMemo(
    () => (open ? buildSearchIndex(BOOK, BOOK_ENTRIES_ORDERED) : []),
    [open],
  );
  const results = React.useMemo(
    () => searchIndex(index, deferred, scope),
    [index, deferred, scope],
  );
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Поиск по книге">
          <Search className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        className="w-full sm:max-w-xl"
        aria-describedby="search-description"
        onCloseAutoFocus={(event) => {
          if (selecting.current) {
            event.preventDefault();
            selecting.current = false;
          }
        }}
      >
        <SheetHeader>
          <SheetTitle>Поиск</SheetTitle>
          <SheetDescription id="search-description">
            По заголовкам, тексту, сноскам и словарю терминов.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 space-y-3">
          <Input
            aria-label="Поисковый запрос"
            placeholder="Слово или несколько слов…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(30);
            }}
          />
          <label className="flex items-center gap-2 text-sm">
            Искать в
            <select
              aria-label="Область поиска"
              className="rounded border bg-background p-2 min-w-0"
              value={scope}
              onChange={(e) => {
                setScope(e.target.value as SearchScope);
                setLimit(30);
              }}
            >
              <option value="all">Всей книге и словаре</option>
              <option value="titles">Заголовках</option>
              <option value="text">Тексте и сносках</option>
              <option value="terms">Терминах</option>
            </select>
          </label>
          <p role="status" className="text-xs text-muted-foreground">
            {!query.trim()
              ? "Введите запрос. Все слова должны встретиться в одном фрагменте."
              : deferred !== query
                ? "Ищем…"
                : `Найдено: ${results.length}`}
          </p>
        </div>
        <div className="overflow-y-auto min-h-0 px-4 pb-6 space-y-3">
          {results.slice(0, limit).map((result) =>
            result.entryId ? (
              <button
                key={result.key}
                type="button"
                className="block w-full text-left rounded-lg border p-3 hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"
                onClick={() => {
                  selecting.current = true;
                  setOpen(false);
                  onOpenEntry(result.entryId!, result.target);
                }}
              >
                <span className="block text-xs text-primary mb-1">
                  {result.kind === "title" ? "Заголовок" : "Текст"} · с.{" "}
                  {result.page}
                </span>
                <span className="block font-semibold text-sm">
                  {result.title}
                </span>
                {result.kind !== "title" && (
                  <span className="block text-sm text-muted-foreground mt-2 break-words">
                    {searchExcerpt(result.text, deferred)}
                  </span>
                )}
              </button>
            ) : (
              <article key={result.key} className="rounded-lg border p-3">
                <p className="text-xs text-primary">Термин</p>
                <h3 className="font-semibold mt-1">{result.title}</h3>
                {BOOK.terms.find((t) => t.id === result.termId)?.ar && (
                  <p className="font-arabic text-2xl mt-2" dir="rtl" lang="ar">
                    {BOOK.terms.find((t) => t.id === result.termId)?.ar}
                  </p>
                )}
                <p className="text-sm font-medium mt-2">
                  {BOOK.terms.find((t) => t.id === result.termId)?.short}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {BOOK.terms.find((t) => t.id === result.termId)?.note}
                </p>
              </article>
            ),
          )}
          {query.trim() && !results.length && deferred === query && (
            <p className="text-sm text-muted-foreground">
              Совпадений нет. Попробуйте другое слово или область поиска.
            </p>
          )}
          {results.length > limit && (
            <Button variant="outline" onClick={() => setLimit((n) => n + 30)}>
              Показать ещё
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
