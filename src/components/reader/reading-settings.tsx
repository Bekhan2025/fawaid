"use client";
import { Settings2, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import * as React from "react";
import { BOOK_TEXT } from "@/content/book";
import { paragraphId, paragraphText } from "@/lib/book-search";
import type { ReaderPreferences } from "@/hooks/use-reader-preferences";
export function ReadingSettings({
  preferences,
  ready,
  storageError,
  update,
  toggleBookmark,
  onOpenEntry,
}: {
  preferences: ReaderPreferences;
  ready: boolean;
  storageError: boolean;
  update: (change: (p: ReaderPreferences) => ReaderPreferences) => void;
  toggleBookmark: (entryId: string, paragraph: number) => void;
  onOpenEntry: (id: string, target?: string) => void;
}) {
  const selecting = React.useRef(false);
  const [open, setOpen] = React.useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Настройки чтения и закладки"
        >
          <Settings2 className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        className="w-full sm:max-w-md overflow-y-auto"
        onCloseAutoFocus={(event) => {
          if (selecting.current) {
            event.preventDefault();
            selecting.current = false;
          }
        }}
      >
        <SheetHeader>
          <SheetTitle>Чтение и закладки</SheetTitle>
          <SheetDescription>
            Настройки и закладки сохраняются в этом браузере.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6 space-y-6">
          {storageError && (
            <p role="status" className="text-sm text-muted-foreground">
              Сохранение недоступно. Изменения действуют до закрытия страницы.
            </p>
          )}
          <fieldset disabled={!ready} className="space-y-4">
            <label className="block text-sm font-medium">
              Размер текста книги
              <select
                aria-label="Размер текста книги"
                className="block mt-2 border rounded bg-background p-2 w-full"
                value={preferences.size}
                onChange={(e) =>
                  update((p) => ({ ...p, size: Number(e.target.value) }))
                }
              >
                {[16, 18, 20, 22, 24].map((n) => (
                  <option key={n} value={n}>
                    {n} px
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Межстрочный интервал
              <select
                aria-label="Межстрочный интервал"
                className="block mt-2 border rounded bg-background p-2 w-full"
                value={preferences.spacing}
                onChange={(e) =>
                  update((p) => ({ ...p, spacing: Number(e.target.value) }))
                }
              >
                <option value={1.5}>Компактный</option>
                <option value={1.72}>Обычный</option>
                <option value={2}>Свободный</option>
              </select>
            </label>
            <Button
              variant="outline"
              onClick={() => update((p) => ({ ...p, size: 18, spacing: 1.72 }))}
            >
              Сбросить оформление
            </Button>
          </fieldset>
          <section aria-label="Закладки">
            <h2 className="font-bold mb-3">
              Закладки · {preferences.bookmarks.length}
            </h2>
            {!preferences.bookmarks.length && (
              <p className="text-sm text-muted-foreground">
                В слое «Книга» нажмите значок закладки рядом с нужным абзацем.
              </p>
            )}
            <ul className="space-y-3">
              {preferences.bookmarks.map((b) => {
                const entry = BOOK_TEXT[b.entryId];
                return (
                  <li
                    key={`${b.entryId}-${b.paragraph}`}
                    className="border rounded p-3 flex gap-2"
                  >
                    <button
                      type="button"
                      className="flex-1 min-w-0 text-left"
                      onClick={() => {
                        selecting.current = true;
                        setOpen(false);
                        onOpenEntry(
                          b.entryId,
                          paragraphId(b.entryId, b.paragraph),
                        );
                      }}
                    >
                      <span className="block text-sm font-semibold">
                        {entry.title}
                      </span>
                      <span className="block text-xs text-muted-foreground mt-2">
                        {paragraphText(entry.paragraphs[b.paragraph])
                          .replace(/\{\{\d+\}\}/g, "")
                          .slice(0, 140)}
                        …
                      </span>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Удалить закладку: ${entry.title}, абзац ${b.paragraph + 1}`}
                      onClick={() => toggleBookmark(b.entryId, b.paragraph)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
