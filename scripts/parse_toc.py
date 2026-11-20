#!/usr/bin/env python3
"""
Парсинг оглавления книги «Фаваид» (изд. Умма, 2013) из upload/ru_fawaid.pdf
и генерация src/content/toc.ts для сайдбара читалки.

Оглавление в конце книги: строки вида «Заголовок…………… 123».
Шаг 1 — парсинг записей; шаг 2 — привязка к тематическим частям.
"""
import json
import re
import subprocess
import sys
from pathlib import Path
import tempfile
import shutil
from content_paths import PDF, TOC, chapter_links, require_pdf

require_pdf()
if not shutil.which("pdftotext"):
    sys.exit("Не найден pdftotext. Установите poppler-utils.")
OUT_TS = TOC
OUT_JSON = Path(tempfile.gettempdir()) / "fawaid-toc.json"
# Always extract the selected PDF; never reuse a stale global text cache.
with tempfile.TemporaryDirectory(prefix="fawaid-toc-") as tmp:
    txt = Path(tmp) / "book.txt"
    subprocess.run(["pdftotext", "-layout", str(PDF), str(txt)], check=True)
    source_text = txt.read_text(encoding="utf-8")

lines = source_text.splitlines()

# --- 1. Найти начало оглавления (первая строка-«Оглавление» без номера страницы)
start = None
for i, ln in enumerate(lines):
    if ln.strip() == "Оглавление":
        start = i
        break
if start is None:
    sys.exit("Не найдено начало оглавления")

# --- 2. Конец оглавления — до колофона
end = len(lines)
for i in range(start, len(lines)):
    if "Дизайн переплёта" in lines[i]:
        end = i
        break

SKIP_RE = [
    re.compile(r"^\s*Оглавление\s*\d*\s*$"),
    re.compile(r"^\s*\d{3}\s+Имам Ибн Каййим.*$"),
    re.compile(r"^\s*Имам Ибн Каййим.*\d{3}\s*$"),
]
# Одинарное «…» перед номером — норма вёрстки этого оглавления
# (строки 309, 322, 324), поэтому класс повторяется 1+ раз.
ENTRY_END = re.compile(r"[.…]\s*(\d{1,3})\s*$")

entries = []
buf: list[str] = []
for ln in lines[start + 1 : end]:
    if not ln.strip():
        continue
    if any(r.match(ln) for r in SKIP_RE):
        continue
    m = ENTRY_END.search(ln)
    if m:
        prefix = ln[: m.start()]
        buf.append(prefix)
        title = re.sub(r"\s+", " ", " ".join(buf)).strip()
        title = re.sub(r"[.…\s]+$", "", title).strip()
        entries.append({"title": title, "page": int(m.group(1))})
        buf = []
    else:
        buf.append(ln.strip())

print(f"Распознано записей: {len(entries)}")

# --- 3. Отделить маркер («Раздел.», «Польза.» и т.д.)
MARKERS = [
    "Очень полезный раздел",
    "Важное правило",
    "Важная польза",
    "Важное замечание",
    "Полезное правило",
    "Наставление",
    "Раздел",
    "Польза",
    "Правило",
    "Замечание",
]
SPECIAL = {  # записи без маркера в оглавлении
    "Единобожие — спасение для Его врагов и Его приближённых": "Раздел",
    "Из слов шейха 'Али": "Изречение",
    "Об авторе": "Введение",
    "Предисловие": "Введение",
}

for e in entries:
    t = e["title"]
    marker = None
    for mk in MARKERS:
        if t.startswith(mk + "."):
            marker = mk
            t = t[len(mk) + 1 :].strip()
            break
    if marker is None:
        for key, mk in SPECIAL.items():
            if t == key:
                marker = mk
                break
    if marker is None and t.startswith("Важное правило, касающееся"):
        marker, t = "Важное правило", t[len("Важное правило, "):].strip()
    # Гифенация в оглавлении: «ас- Сыддика» → «ас-Сыддика», «Ма-с'уда» → «Мас'уда»
    t = re.sub(r"([а-яё])- (?=[А-ЯЁ])", r"\1-", t)
    t = t.replace("Ма-с'уда", "Мас'уда")
    if t and t[0].islower():  # «касающееся предопределения» после запятой в маркере
        t = t[0].upper() + t[1:]
    if marker is None:
        print(f"!! БЕЗ МАРКЕРА: с.{e['page']} — {t[:80]}")
        marker = "Раздел"
    e["marker"] = marker
    e["title"] = t

# --- 4. Проверка монотонности страниц (ошибка парсинга даст откат назад)
prev = 0
for e in entries:
    if e["page"] < prev:
        print(f"!! СБРОС СТРАНИЦ: с.{e['page']} после с.{prev} — {e['title'][:60]}")
    prev = e["page"]

json.dump(entries, open(OUT_JSON, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# --- 5. Тематические части (страница → часть). Группировка составительская:
# автор книги материала по главам не делил.
PARTS = [
    ("p0",  "О книге",                    [4, 8]),
    ("p1",  "Коран и хадисы",             [12, 16, 34, 38, 41, 61, 67, 175, 292, 447]),
    ("p2",  "Познание Аллаха",            [44, 149, 384, 402, 406, 410, 415]),
    ("p3",  "Единобожие и вера",          [109, 117, 186, 230, 236, 243, 261, 352, 441]),
    ("p4",  "Упование и предопределение", [83, 108, 187, 210, 245, 249, 297, 359, 408, 422]),
    ("p5",  "Знание и невежество",        [183, 223, 226, 381, 388]),
    ("p6",  "Сердце и поминание",         [47, 59, 64, 74, 97, 127, 178, 281, 284, 306, 309, 342, 350, 370, 378, 393, 430, 433, 444, 449]),
    ("p7",  "Нравственность",             [76, 114, 124, 125, 299, 310, 320, 335, 356, 423]),
    ("p8",  "Мир этот и отрешённость",    [94, 204, 218, 234, 298, 337, 386, 435, 456]),
    ("p9",  "Путь к Аллаху",              [112, 126, 181, 192, 198, 254, 256, 257, 259, 302, 315, 322, 345, 347, 348, 389, 391, 431, 455]),
    ("p10", "Связь раба с Господом",      [96, 111, 115, 190, 349, 387, 421, 434, 437, 439, 443, 458, 459, 460, 463, 465]),
    ("p11", "Истории и изречения",        [70, 80, 90, 98, 131, 134, 137, 143, 154, 161, 163, 169, 324, 371, 383, 405, 429, 445, 452]),
]
CHAPTER_LINKS = chapter_links()
unknown_links = set(CHAPTER_LINKS) - {"e" + str(e["page"]) for e in entries}
if unknown_links:
    sys.exit(f"Неизвестные записи в chapter-links.json: {sorted(unknown_links)}")

page_map = {}
for pid, _label, pages in PARTS:
    for p in pages:
        if p in page_map:
            sys.exit(f"Страница {p} указана дважды ({page_map[p]} и {pid})")
        page_map[p] = pid

book_pages = {e["page"] for e in entries}
unmapped = sorted(book_pages - set(page_map))
unlisted = sorted(set(page_map) - book_pages)
if unmapped:
    for p in unmapped:
        e = next(x for x in entries if x["page"] == p)
        print(f"!! НЕ РАСПРЕДЕЛЕНО: с.{p} — {e['title'][:80]}")
if unlisted:
    print(f"!! В КАРТЕ ЛИШНИЕ СТРАНИЦЫ: {unlisted}")
if unmapped or unlisted:
    sys.exit("Карта частей неполна — исправь PARTS")

# --- 6. Генерация toc.ts
ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"]


def ts(s: str) -> str:
    return json.dumps(s, ensure_ascii=False)


out = []
out.append("// СГЕНЕРИРОВАНО scripts/parse_toc.py по оглавлению издания:")
out.append("// Ибн Каййим аль-Джаузиййа, «Фаваид» (М.: Умма, 2013), с. 472–479.")
out.append("// Автор не делил книгу на главы — тематические части составлены для навигации.")
out.append("import type { BookPart } from \"@/lib/types\";")
out.append("")
out.append("export const TOC_PARTS: BookPart[] = [")
for idx, (pid, label, _pages) in enumerate(PARTS):
    roman = ROMAN[idx]
    out.append("  {")
    out.append(f"    id: {ts(pid)},")
    out.append(f"    num: {ts(roman)},")
    out.append(f"    label: {ts(label)},")
    out.append("    entries: [")
    for e in entries:
        if page_map[e["page"]] != pid:
            continue
        chapter_id = CHAPTER_LINKS.get("e" + str(e["page"]))
        chapter = f", chapterId: {ts(chapter_id)}" if chapter_id else ""
        out.append(
            f"      {{ id: {ts('e' + str(e['page']))}, page: {e['page']}, "
            f"marker: {ts(e['marker'])}, title: {ts(e['title'])}{chapter} }},"
        )
    out.append("    ],")
    out.append("  },")
out.append("];")
out.append("")
out.append(f"export const TOC_STATS = {{ totalEntries: {len(entries)}, parts: {len(PARTS)} }} as const;")
out.append("")

OUT_TS.write_text("\n".join(out), encoding="utf-8")
print(f"\nЗаписано {OUT_TS} ({len(entries)} записей, {len(PARTS)} частей)")
for pid, label, _pages in PARTS:
    n = sum(1 for e in entries if page_map[e["page"]] == pid)
    print(f"  {pid:>4} {label:<28} {n}")

# Полный список для ревью
print("\n--- ПОЛНЫЙ СПИСОК ---")
for e in entries:
    print(f"{e['page']:>4}  [{e['marker']}]  {e['title'][:95]}")
