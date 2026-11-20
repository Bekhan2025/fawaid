"""Shared paths and editorial chapter links for content generators."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / 'upload/ru_fawaid.pdf'
TOC = ROOT / 'src/content/toc.ts'
OUT_DIR = ROOT / 'src/content/book-text'


def chapter_links():
    path = ROOT / 'src/content/chapter-links.json'
    try:
        links = json.loads(path.read_text(encoding='utf-8'))
    except (OSError, ValueError) as error:
        raise SystemExit(f'Не удалось прочитать {path}: {error}')
    if not isinstance(links, dict) or any(
        not isinstance(k, str) or not isinstance(v, str) for k, v in links.items()
    ):
        raise SystemExit('chapter-links.json: expected an object of entryId → chapterId strings')
    return links


def require_pdf():
    if not PDF.is_file():
        raise SystemExit(f'Не найден PDF издания: {PDF}')
