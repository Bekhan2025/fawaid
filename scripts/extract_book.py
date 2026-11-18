#!/usr/bin/env python3
"""
Извлечение текста книги «Фаваид» (изд. Умма, 2013) из PDF в JSON по записям оглавления.

Структура PDF (установлена инспекцией):
- страница = печатная страница (смещения нет), текст книги: с. 4-472, оглавление 473-479
- колонтитулы: y<52, кегль <=12.8 (номер страницы + название/автор)
- маркеры («Раздел», «Польза»…): кегль 16.6-21.5
- заголовки записей: кегль 13.6-16.6 (несколько строк с отступом x~51)
- тело: кегль = мода на странице (12.0 / 13.0 на с. 310-311 / 11.5 на с. 187),
  левое поле x~50, абзацный отступ x>=64
- буквицы: кегль >21.5, 1 символ; басмала: >21.5 многосимвольная (центр)
- стихи/цитаты: кегль body-1.7..body-0.55, x>=66
- сноски: зона от первого номера сноски (цифры 5.5-8.5, x 55-105, y>0.55*H);
  тексты сносок кегль <=10.6; нумерация сквозная по книге
- маркеры сносок в тексте: цифры кеглем <=9.8 вне зон -> {{n}}
- орнамент ﷺ: image-блоки малы, вставлены в межсловный промежуток строки
"""
import fitz
import json
import re
import sys
import unicodedata
from collections import Counter
from difflib import SequenceMatcher

PDF = "/home/z/my-project/upload/ru_fawaid.pdf"
TOC = "/home/z/my-project/src/content/toc.ts"
OUT_DIR = "/home/z/my-project/src/content/book-text"
FIRST_PAGE, LAST_PAGE = 4, 471

MARKERS = {
    "Польза", "Раздел", "Правило", "Важное правило", "Важная польза",
    "Полезное правило", "Замечание", "Важное замечание", "Наставление",
    "Изречение", "Очень полезный раздел",
}
SALLA_WORDS = ("Аллаха", "Аллах", "Аллаху", "Пророка", "Пророк", "Пророку",
               "Посланника", "Посланник", "Посланнику", "Его")

# точечные OCR-правки (артефакты распознавания)
OCR_WORD_FIXES = [
    ("изокружения", "из окружения"),
    ("альислямиййа", "аль-ислямиййа"),
]

# буквицы-предлоги: между буквицей и словом нужен пробел (id записи)
DC_SPACE_FIXES = {
    "e310": ("Унравственности", "У нравственности"),
    "e350": ("Кпризнакам", "К признакам"),
    "e423": ("Квеличайшим", "К величайшим"),
    "e455": ("Ураба", "У раба"),
    "e408": ("Кскрытым", "К скрытым"),
    "e124": ("Всловах", "В словах"),
    "e284": ("ВКоране", "В Коране"),
    "e393": ("Воснове", "В основе"),
    "e47": ("В«Муснаде»", "В «Муснаде»"),
    "e163": ("Обезоружный", "О безоружный"),
    "e459": ("Вевышний", "Всевышний"),
    "e96": ("дна", "Одна"),
}

# ---------------------------------------------------------------- утилиты

def norm(s: str) -> str:
    s = s.lower().replace("ё", "е")
    return re.sub(r"[^a-zа-я0-9]", "", s)


def fuzzy(a: str, b: str) -> float:
    a, b = norm(a), norm(b)
    if not a or not b:
        return 0.0
    if a == b:
        return 1.0
    if len(a) > 12 and (a in b or b in a):
        return 0.95
    return SequenceMatcher(None, a, b).ratio()


def clean_text(s: str) -> str:
    s = re.sub(r"[ \t]+", " ", s).strip()
    s = re.sub(r"\s*\uFDFA\s*", " \uFDFA ", s)
    s = re.sub(r"\s+([,.!?;:»…])", r"\1", s)
    s = re.sub(r"([,;:])(?=[А-ЯЁа-яёA-Za-z«])", r"\1 ", s)
    s = re.sub(r"«\s+", "«", s)
    s = re.sub(r"\(\s+", "(", s)
    s = re.sub(r"\s+\)", ")", s)
    s = re.sub(r"\)(?=[А-ЯЁа-яё])", ") ", s)
    s = re.sub(r"(?<!\d)\s*—\s*(?!\d)", " — ", s)
    for bad, good in OCR_WORD_FIXES:
        s = s.replace(bad, good)
    return s.strip()


def ends_sentence(s: str) -> bool:
    return bool(s) and s.rstrip()[-1:] in ".!?…»\"'"


def join_lines(a: str, b: str) -> str:
    """Склейка строк с дефисной обработкой."""
    a, b = a.rstrip(), b.lstrip()
    if a.endswith("-") and b and (b[0].islower() or b[0] in "«"):
        return a[:-1] + b
    if a.endswith("-") and b and b[0].isupper():
        return a + b
    return a + " " + b


# ---------------------------------------------------------------- загрузка TOC

def load_toc():
    src = open(TOC, encoding="utf-8").read()
    entries = []
    for m in re.finditer(
        r'\{\s*id:\s*"(\w+)",\s*page:\s*(\d+),\s*marker:\s*"([^"]+)",\s*'
        r'title:\s*"((?:[^"\\]|\\.)*)"(?:,\s*chapterId:\s*"(\w+)")?\s*\}',
        src,
    ):
        title = m.group(4).replace('\\"', '"')
        entries.append({
            "id": m.group(1), "page": int(m.group(2)),
            "marker": m.group(3), "title": title,
            "chapterId": m.group(5),
        })
    part_of = {}
    for pm in re.finditer(r'id:\s*"(p\d+)",\s*num:\s*"([^"]+)",\s*label:\s*"([^"]+)"', src):
        part_of[pm.group(1)] = (pm.group(2), pm.group(3))
    return entries, part_of


# ---------------------------------------------------------------- строки PDF

def collect_lines(page, pno):
    """Возвращает (body_items, foot_lines). body_items: dict(type,y,x0,text,page)."""
    H = page.rect.height
    raw = []
    for b in page.get_text("dict")["blocks"]:
        if b["type"] == 1:
            raw.append({"img": True, "bbox": b["bbox"]})
            continue
        for ln in b["lines"]:
            spans = [s for s in ln["spans"] if s["text"].strip()]
            if not spans:
                continue
            spans.sort(key=lambda s: s["bbox"][0])
            raw.append({"img": False, "bbox": ln["bbox"], "spans": spans})

    # сортировка: группируем «визуальные строки» (строки с разрывом верха <= 6pt
    # читаются слева направо), затем по y
    raw.sort(key=lambda r: (r["bbox"][1], r["bbox"][0]))
    imgs = [r for r in raw if r["img"]]
    raw_lines = [r for r in raw if not r["img"]]
    rows, cur_row, ref_y = [], [], None
    for r in raw_lines:
        y = r["bbox"][1]
        if cur_row and abs(y - ref_y) <= 6:
            cur_row.append(r)
        else:
            if cur_row:
                rows.append(cur_row)
            cur_row, ref_y = [r], y
    if cur_row:
        rows.append(cur_row)
    lines = []
    for row in rows:
        row.sort(key=lambda r: r["bbox"][0])
        lines.extend(row)

    # --- вставка ﷺ в межсловные промежутки
    def try_place_img(img):
        x0, y0, x1, y1 = img["bbox"]
        cy = (y0 + y1) / 2
        best = None
        for li, r in enumerate(lines):
            if abs(cy - (r["bbox"][1] + r["bbox"][3]) / 2) > 9:
                continue
            sp = r["spans"]
            for i in range(len(sp) - 1):
                gap0, gap1 = sp[i]["bbox"][2], sp[i + 1]["bbox"][0]
                if gap0 - 4 <= x0 and x1 <= gap1 + 4 and gap1 - gap0 > (x1 - x0) - 6:
                    best = (li, i)
            # изображение сразу после последнего спана строки
            if abs(sp[-1]["bbox"][2] - x0) < 7 and abs(cy - (sp[-1]["bbox"][1])) < 12:
                if best is None:
                    best = (li, len(sp) - 1)
        if best is None:
            return False
        li, i = best
        sp = lines[li]["spans"]
        prev = sp[i]["text"].rstrip()
        nxt = sp[i + 1]["text"].lstrip() if i + 1 < len(sp) else ""
        if not nxt and li + 1 < len(lines):
            nxt = "".join(s["text"] for s in lines[li + 1]["spans"]).lstrip()
        if prev.endswith(SALLA_WORDS) or (nxt and nxt[:1].islower()):
            sp[i]["text"] = prev + "\uFDFA "
            return True
        return False

    used_imgs = set()
    for k, img in enumerate(imgs):
        x0, y0, x1, y1 = img["bbox"]
        if (x1 - x0) <= 30 and (y1 - y0) <= 22:
            if try_place_img(img):
                used_imgs.add(k)

    # декоративные разделители между изречениями: отдельный пункт потока
    dividers = []
    for k, img in enumerate(imgs):
        if k in used_imgs:
            continue
        x0, y0, x1, y1 = img["bbox"]
        w, h = x1 - x0, y1 - y0
        cx = (x0 + x1) / 2
        if w <= 30 and h <= 22 and 170 <= cx <= 250:
            dividers.append(y0)
    dividers.sort()

    # --- номера сносок -> зона сносок
    zone_start = None
    for r in lines:
        y0 = r["bbox"][1]
        if y0 < 0.55 * H or y0 > 0.95 * H:
            continue
        first = r["spans"][0]
        t = first["text"].strip()
        if t.isdigit() and 5.0 <= first["size"] <= 8.6 and 55 <= first["bbox"][0] <= 110:
            zone_start = y0 - 6 if zone_start is None else min(zone_start, y0 - 6)

    items, foots = [], []
    sizes = Counter()
    for r in lines:
        y0, x0 = r["bbox"][1], r["bbox"][0]
        text_parts, max_sz = [], 0
        for s in r["spans"]:
            t, sz = s["text"], s["size"]
            if sz <= 9.8 and t.strip().isdigit() and (zone_start is None or y0 < zone_start) and y0 > 52:
                text_parts.append("{{%s}}" % t.strip())
                continue
            text_parts.append(t)
            max_sz = max(max_sz, sz)
        text = "".join(text_parts)
        if not text.strip():
            continue
        if y0 < 52 and max_sz <= 12.8:
            continue  # колонтитул
        if zone_start is not None and y0 >= zone_start:
            foots.append((pno, y0, x0, text))
            continue
        if max_sz <= 10.6:
            foots.append((pno, y0, x0, text))
            continue
        # разделитель, встреченный до этой строки — вставим перед первым
        while dividers and dividers[0] < y0:
            dividers.pop(0)
            items.append({"page": pno, "y": y0 - 0.5, "x0": x0, "size": 0,
                          "text": "", "type": "divider", "kind": "divider"})
        sizes[round(max_sz * 2) / 2] += 1
        items.append({"page": pno, "y": y0, "x0": x0, "size": max_sz, "text": text,
                      "type": "text", "kind": "text"})

    # --- мода кегля тела: диапазон [11.3, 14.2] исключает стихи (11.0);
    # при равенстве предпочтём больший кегль
    body_candidates = Counter()
    for it in items:
        sz = it["size"]
        if it["type"] == "divider":
            continue
        if 11.3 <= sz <= 14.2:
            body_candidates[sz] += 1
    if body_candidates:
        body_size = max(body_candidates.items(), key=lambda kv: (kv[1], kv[0]))[0]
    else:
        body_size = 12.0
    xs = [it["x0"] for it in items if it["x0"] < 60 and it["size"] < body_size + 0.7]
    left = min(xs) if xs else 50.0

    # --- предварительная классификация по кеглю
    for it in items:
        if it["type"] == "divider":
            continue
        sz = it["size"]
        if sz > 21.5:
            it["type"] = "dropcap" if len(it["text"].strip()) <= 2 else "center"
        elif sz > 16.6:
            it["type"] = "marker"
        elif sz > body_size + 0.7:
            it["type"] = "title"
        else:
            it["type"] = "body"
    # --- переклассификация: заголовки, набранные кеглем тела (с. 16 и т.п.):
    # после маркера/заголовка строка кегля тела у левого края, за которой
    # большой интервал (>45pt) — это заголовок
    i = 0
    while i < len(items):
        it = items[i]
        if it["type"] in ("marker", "title"):
            j = i + 1
            run = []
            while j < len(items):
                nx = items[j]
                if nx["type"] != "body" or nx["size"] != body_size or nx["x0"] >= left + 13.5:
                    break
                if run and nx["y"] - items[j - 1]["y"] > 25:
                    break
                run.append(j)
                j += 1
            after_gap = (items[j]["y"] - items[j - 1]["y"]) if run and j < len(items) else 999
            if run and (j >= len(items) or after_gap > 45) and items[run[0]]["y"] - it["y"] < 50:
                for k2 in run:
                    items[k2]["type"] = "title"
                i = j
                continue
        i += 1

    # --- body vs verse (уточнение для не-заголовков); стихи — 11.0pt при теле 12
    out = []
    for it in items:
        if it["type"] in ("dropcap", "center", "marker", "title", "divider"):
            out.append(it)
            continue
        sz = it["size"]
        if body_size - 1.75 <= sz < body_size - 0.55:
            it["type"] = "verse"
        else:
            it["type"] = "body"
        out.append(it)
    return out, foots


# ---------------------------------------------------------------- параграфы

def build_stream(doc):
    stream, all_foots = [], []
    left_by_page = {}
    for pno in range(FIRST_PAGE, LAST_PAGE + 1):
        items, foots = collect_lines(doc[pno - 1], pno)
        all_foots.extend(foots)
        xs = [it["x0"] for it in items if it["type"] == "body" and it["x0"] < 60]
        left_by_page[pno] = min(xs) if xs else 50.0
        stream.extend(items)
    # пересортировка и переклассификация уже внутри collect_lines

    # сортировка устойчивая по (page, y) не нужна: collect_lines уже отдаёт
    # пункты в визуальном порядке (группировка «строк» внутри страницы)
    stream = [it for it in stream if not (it.get("skip"))]

    paras = []  # {page, kind, text|lines}
    cur = None  # {page, kind:'body', text} | {'kind':'verse','lines':[...]}
    pending_dropcap = None
    force_new = False

    def flush():
        nonlocal cur
        if cur is None:
            return
        if cur["kind"] == "body":
            t = clean_text(cur["text"])
            if t:
                paras.append({"page": cur["page"], "kind": "body", "text": t})
        elif cur["kind"] == "verse":
            lines = [clean_text(l) for l in cur["lines"] if clean_text(l)]
            if lines:
                paras.append({"page": cur["page"], "kind": "verse", "lines": lines})
        cur = None

    prev_text = ""
    prev_kind = None
    for it in stream:
        kind, text, page, x0 = it["type"], it["text"], it["page"], it["x0"]
        if kind == "divider":
            flush()
            prev_text, prev_kind = ".", "divider"
            force_new = True
            continue
        if kind == "dropcap":
            flush()
            pending_dropcap = text.strip()
            prev_text, prev_kind = "", "dropcap"
            continue
        if kind in ("marker", "title", "center"):
            flush()
            paras.append({"page": page, "kind": kind, "text": clean_text(text)})
            prev_text, prev_kind = text, kind
            continue
        if kind == "verse":
            if cur is not None and cur["kind"] == "verse" and cur["page"] == page:
                cur["lines"].append(text)
            else:
                flush()
                cur = {"page": page, "kind": "verse", "lines": [text]}
            prev_text, prev_kind = text, "verse"
            continue

        # body
        left = left_by_page[page]
        new_para = False
        if cur is None or cur["kind"] != "body":
            new_para = True
        elif force_new:
            new_para = True
        elif pending_dropcap is not None:
            new_para = False  # продолжение буквицы
        elif x0 >= left + 13.5 and ends_sentence(prev_text if prev_kind in ("body", "dropcap") else ""):
            new_para = True
        elif x0 >= left + 13.5 and prev_kind not in ("body", "dropcap"):
            new_para = True

        if new_para:
            flush()
            force_new = False
            head = ""
            if pending_dropcap is not None:
                head = pending_dropcap
                pending_dropcap = None
            first_word = text.lstrip()
            if head:
                # буквица по умолчанию сливается со словом («Всевышний»);
                # исключения (предлоги) правятся в assemble по id записи
                cur = {"page": page, "kind": "body", "text": head + first_word}
            else:
                cur = {"page": page, "kind": "body", "text": text}
        else:
            cur["text"] = join_lines(cur["text"], text)
        prev_text, prev_kind = text, "body"

    flush()
    return paras, all_foots


# слова, где буквица слита со словом (пополняется по результатам ревизии)
DC_JOIN_WORDS = set()

def load_dc_exceptions():
    try:
        for w in json.load(open("/home/z/my-project/scripts/dc_join_words.json", encoding="utf-8")):
            DC_JOIN_WORDS.add(w)
    except FileNotFoundError:
        pass


# ---------------------------------------------------------------- сноски

def parse_footnotes(foots):
    """foots: (page, y, x0, text) -> {n: {page, text}}"""
    by_page = {}
    for pno, y, x0, text in sorted(foots, key=lambda f: (f[0], f[1])):
        by_page.setdefault(pno, []).append((y, x0, text))
    notes = {}
    for pno, rows in by_page.items():
        cur_n, cur = None, []
        for y, x0, text in rows:
            t = text.strip()
            m = re.match(r"^(\d{1,3})\s*(.*)$", t, re.S)
            first = text_parts_first_digit(t)
            if m and 55 <= x0 <= 110 and m.group(1).isdigit():
                if cur_n is not None:
                    save_note(notes, cur_n, pno, cur)
                cur_n, cur = int(m.group(1)), [m.group(2)]
            else:
                if cur_n is None:
                    continue
                cur.append(t)
        if cur_n is not None:
            save_note(notes, cur_n, pno, cur)
    return notes


def text_parts_first_digit(t):
    return None


def save_note(notes, n, page, rows):
    text = rows[0]
    for r in rows[1:]:
        text = join_lines(text, r)
    text = clean_text(text)
    if not text:
        return
    if n in notes and len(text) < len(notes[n]["text"]) * 0.3:
        return
    notes[n] = {"page": page, "text": text}


# ---------------------------------------------------------------- заголовки и сопоставление

def find_headings(paras):
    """Группы параграфов-заголовков: маркер + строки заголовка подряд."""
    groups = []
    i = 0
    while i < len(paras):
        p = paras[i]
        if p["kind"] in ("marker", "title"):
            group = [p]
            j = i + 1
            while j < len(paras) and paras[j]["kind"] in ("marker", "title"):
                group.append(paras[j])
                j += 1
            texts = [re.sub(r"\{\{\d+\}\}", "", g["text"]) for g in group]
            texts = [clean_text(t) for t in texts if t.strip()]
            marker = None
            title_parts = texts
            if texts and any(norm(texts[0]) == norm(mk) for mk in MARKERS):
                marker, title_parts = texts[0], texts[1:]
            title = " ".join(title_parts)
            groups.append({
                "idx": i, "next": j, "marker": marker, "title": clean_text(title),
                "page": group[0]["page"],
                "pages_covered": (group[0]["page"], group[-1]["page"]),
            })
            i = j
        else:
            i += 1
    return groups


def strip_tokens(s):
    return re.sub(r"\{\{\d+\}\}", "", s)


def match_toc(toc_entries, groups, paras):
    """Сопоставляет записи оглавления группам заголовков В ПОРЯДКЕ СТРАНИЦ:
    записи в toc.ts идут в порядке тематических частей, а не страниц."""
    used = set()
    by_id = {}
    prev_idx = 0
    report = []
    order = sorted(range(len(toc_entries)), key=lambda i: (toc_entries[i]["page"], i))
    for pos in order:
        e = toc_entries[pos]
        best = None
        for g in groups:
            if g["idx"] in used or g["idx"] < prev_idx:
                continue
            r = fuzzy(g["title"], e["title"])
            mk_ok = (g["marker"] is None) or fuzzy(g["marker"], e["marker"]) > 0.55
            if mk_ok and r > 0.6:
                if best is None or r > best[1]:
                    best = (g, r)
        if best:
            g = best[0]
            used.add(g["idx"])
            by_id[e["id"]] = {"entry": e, "head_idx": g["idx"], "body_idx": g["next"],
                              "page": g["page"], "matched": True, "ratio": best[1]}
            prev_idx = g["next"]
        else:
            # фолбэк: первый параграф тела со страницей >= entry.page
            bidx = None
            for i in range(prev_idx, len(paras)):
                if paras[i]["kind"] in ("marker", "title"):
                    continue
                if paras[i]["page"] >= e["page"]:
                    bidx = i
                    break
            if bidx is None:
                bidx = len(paras)
            # срезать лидирующие строки, похожие на заголовок
            skipped = 0
            while bidx < len(paras):
                t = strip_tokens(paras[bidx].get("text", ""))
                if norm(t) in {norm(mk) for mk in MARKERS}:
                    skipped += 1
                    bidx += 1
                    continue
                if t and len(t) < len(e["title"]) + 20 and fuzzy(t, e["title"]) > 0.55:
                    skipped += 1
                    bidx += 1
                    continue
                break
            by_id[e["id"]] = {"entry": e, "head_idx": bidx - skipped, "body_idx": bidx,
                              "page": e["page"], "matched": False, "ratio": 0.0}
            prev_idx = bidx
            report.append(f"  FALLBACK {e['id']} p.{e['page']} «{e['title'][:50]}…»")
    boundaries = [by_id[e["id"]] for e in toc_entries]
    return boundaries, report


# ---------------------------------------------------------------- сборка

def assemble(toc_entries, boundaries, paras, notes, part_of):
    parts_json = {}
    ocr_fixes_applied = 0
    # сегментация в порядке параграфов
    bsorted = sorted(boundaries, key=lambda b: b["body_idx"])
    by_id = {}
    for k, b in enumerate(bsorted):
        e = b["entry"]
        start = b["body_idx"]
        end = bsorted[k + 1]["body_idx"] if k + 1 < len(bsorted) else len(paras)
        seg = paras[start:end]
        page_start = seg[0]["page"] if seg else b["page"]
        page_end = max(page_start, (bsorted[k + 1]["page"] - 1) if k + 1 < len(bsorted) else LAST_PAGE)

        paragraphs = []
        used_notes = set()
        for p in seg:
            if p["kind"] == "body":
                t = p["text"]
                # маркеры сносок без текста удаляем
                bad = re.sub(r"\{\{(\d+)\}\}",
                             lambda m: m.group(0) if int(m.group(1)) in notes else "\x00",
                             t)
                ocr_fixes_applied += bad.count("\x00")
                t = bad.replace("\x00", "")
                t = clean_text(strip_tokens(t)) if "{{" in t else t
                for m in re.finditer(r"\{\{(\d+)\}\}", t):
                    used_notes.add(int(m.group(1)))
                if t:
                    paragraphs.append(t)
            elif p["kind"] == "verse":
                paragraphs.append({"verse": p["lines"]})
            elif p["kind"] == "center":
                paragraphs.append({"center": p["text"]})

        # правки буквиц-предлогов и потерянных буквиц
        fix = DC_SPACE_FIXES.get(e["id"])
        if fix and paragraphs and isinstance(paragraphs[0], str):
            old, new = fix
            if paragraphs[0].startswith(old):
                paragraphs[0] = new + paragraphs[0][len(old):]

        # сноски: используемые по номеру + остальные со страниц диапазона
        foots = []
        for n in sorted(used_notes):
            foots.append({"n": n, "text": notes[n]["text"]})
        covered = {f["n"] for f in foots}
        for n, note in sorted(notes.items()):
            if n not in covered and page_start <= note["page"] <= page_end:
                foots.append({"n": n, "text": note["text"]})
        foots.sort(key=lambda f: f["n"])

        # приклеенные к словам номера сносок (кегль не распознан):
        # цифра после буквы — маркер сноски, если такой номер есть в записи
        fn_nums = {f["n"] for f in foots}
        fixed_paras = []
        for p in paragraphs:
            if isinstance(p, str) and re.search(r"[а-яё]\d{1,2}\b", p):
                def glue_fix(m):
                    n = int(m.group(2))
                    if n in fn_nums:
                        return f"{m.group(1)}{{{{{n}}}}}"
                    return f"{m.group(1)} {m.group(2)}"
                p = re.sub(r"([а-яё])(\d{1,2})\b", glue_fix, p)
            fixed_paras.append(p)
        paragraphs = fixed_paras

        pnum, plabel = part_of.get(e["_part"], ("", ""))
        by_id[e["id"]] = {
            "id": e["id"], "marker": e["marker"], "title": e["title"],
            "page": page_start, "pageEnd": page_end,
            "partNum": pnum, "partLabel": plabel,
            "chapterId": e["chapterId"],
            "paragraphs": paragraphs, "footnotes": foots,
        }
    # вывод в порядке оглавления (по частям)
    for e in toc_entries:
        parts_json.setdefault(e["_part"], []).append(by_id[e["id"]])
    return parts_json, ocr_fixes_applied


# ---------------------------------------------------------------- главный пайплайн

def main():
    load_dc_exceptions()
    toc_entries, part_of = load_toc()
    # привязка записи к части
    src = open(TOC, encoding="utf-8").read()
    cur_part = None
    for e in toc_entries:
        pass
    # повторный проход: записи идут внутри блоков частей
    part_list = []
    part_re = re.compile(r'id:\s*"(p\d+)"')
    entry_re = re.compile(r'\{\s*id:\s*"(\w+)",\s*page:')
    for line in src.splitlines():
        mp = part_re.search(line)
        if mp:
            cur_part = mp.group(1)
        me = entry_re.search(line)
        if me:
            part_list.append(cur_part)
    assert len(part_list) == len(toc_entries), (len(part_list), len(toc_entries))
    for e, pt in zip(toc_entries, part_list):
        e["_part"] = pt

    doc = fitz.open(PDF)
    paras, foots = build_stream(doc)
    notes = parse_footnotes(foots)
    groups = find_headings(paras)
    boundaries, report = match_toc(toc_entries, groups, paras)

    print(f"параграфов: {len(paras)}, групп заголовков: {len(groups)}, сносок: {len(notes)}")
    matched = sum(1 for b in boundaries if b["matched"])
    print(f"сопоставлено заголовков: {matched}/{len(toc_entries)}")
    for line in report:
        print(line)

    # ревизия буквиц: показать склейки первых слов готовых разделов
    print("\n--- первые слова разделов (ревизия буквиц) ---")
    for b in boundaries:
        idx = b["body_idx"]
        if idx < len(paras) and paras[idx]["kind"] == "body":
            print(f"  {b['entry']['id']} p{paras[idx]['page']}: {paras[idx]['text'][:48]!r}")

    parts_json, fixes = assemble(toc_entries, boundaries, paras, notes, part_of)
    print(f"\nмаркеров сносок без текста удалено: {fixes}")

    import os
    os.makedirs(OUT_DIR, exist_ok=True)
    total_paras = 0
    for pt, entries in sorted(parts_json.items()):
        path = f"{OUT_DIR}/{pt}.json"
        json.dump(entries, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        total_paras += len(entries)
        size = os.path.getsize(path)
        print(f"  {pt}.json: {len(entries)} записей, {size//1024} КБ")
    print(f"всего записей: {total_paras}")

    # сохранение промежуточного дампа для отладки
    with open("/tmp/paras_dump.json", "w", encoding="utf-8") as f:
        json.dump(paras, f, ensure_ascii=False, indent=0)


if __name__ == "__main__":
    main()
