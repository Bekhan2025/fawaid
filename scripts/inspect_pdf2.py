#!/usr/bin/env python3
"""Инспекция: шапки страниц, первые страницы, хвост книги, орнаменты."""
import fitz

doc = fitz.open("/home/z/my-project/upload/ru_fawaid.pdf")

def top(pno, n=8):
    page = doc[pno - 1]
    print(f"\n===== PAGE {pno} top =====")
    d = page.get_text("dict")
    lines = []
    for b in d["blocks"]:
        if b["type"] != 0:
            lines.append((b["bbox"][1], f"[IMG] w={b['bbox'][2]-b['bbox'][0]:.0f} h={b['bbox'][3]-b['bbox'][1]:.0f} x={b['bbox'][0]:.0f}"))
            continue
        for ln in b["lines"]:
            txt = "".join(s["text"] for s in ln["spans"]).strip()
            if not txt:
                continue
            sz = max(s["size"] for s in ln["spans"])
            lines.append((ln["bbox"][1], f"[{sz:.1f}|x{ln['bbox'][0]:.0f}] {txt[:70]!r}"))
    lines.sort()
    for y, t in lines[:n]:
        print(f"  y{y:6.1f} {t}")

for p in [4, 5, 8, 11, 12, 13, 14, 48, 310, 311]:
    top(p)

# Хвост книги
for p in [464, 465, 466, 467, 470, 473, 476, 479, 480]:
    page = doc[p - 1]
    txt = page.get_text().strip().replace("\n", " | ")
    print(f"\n--- PAGE {p}: {txt[:200]}")

# Орнаменты-картинки по всей книге
print("\n===== IMAGE BLOCKS survey =====")
sizes = {}
for pno in range(3, 480):
    for b in doc[pno].get_text("dict")["blocks"]:
        if b["type"] == 1:
            w = b["bbox"][2] - b["bbox"][0]
            h = b["bbox"][3] - b["bbox"][1]
            key = (round(w / 4) * 4, round(h / 4) * 4)
            sizes.setdefault(key, []).append(pno + 1)
for k, v in sorted(sizes.items()):
    print(f"  w~{k[0]} h~{k[1]}: {len(v)}x pages, e.g. {v[:6]}")
