#!/usr/bin/env python3
"""Инспекция структуры страниц PDF «Фаваид»: шрифты, координаты, сноски."""
import fitz
import sys

doc = fitz.open("/home/z/my-project/upload/ru_fawaid.pdf")

def dump(pno):
    page = doc[pno - 1]
    print(f"\n===== PHYS PAGE {pno} (size {page.rect.width:.0f}x{page.rect.height:.0f}) =====")
    d = page.get_text("dict")
    for b in d["blocks"]:
        if b["type"] != 0:
            print(f"  [IMAGE BLOCK] bbox={b['bbox']}")
            continue
        for ln in b["lines"]:
            spans = []
            for s in ln["spans"]:
                txt = s["text"]
                if not txt.strip():
                    continue
                spans.append(f"[{s['font'].split('+')[-1][:14]}|{s['size']:.1f}|x{s['bbox'][0]:.0f}|y{s['bbox'][1]:.0f}]{txt!r}")
            if spans:
                print(f"  line y{ln['bbox'][1]:6.1f} x{ln['bbox'][0]:5.1f}: " + " ".join(spans))

for p in [int(x) for x in sys.argv[1:]] or [13, 47]:
    dump(p)
