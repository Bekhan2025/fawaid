#!/usr/bin/env python3
"""Read one frozen Fawaid entry and verify source byte integrity. No PDF or dependencies."""
import argparse
import hashlib
import json
import sys
from pathlib import Path


def find_root(explicit=None):
    if explicit:
        root = Path(explicit).resolve()
    else:
        candidates = [Path.cwd(), *Path.cwd().parents, *Path(__file__).resolve().parents]
        root = next((p for p in candidates if (p / 'src/content/book-text').is_dir()), None)
        if root is None:
            raise ValueError('Не найден проект. Укажите --root /path/to/fawaid перед подкомандой.')
    if not (root / 'src/content/book-text').is_dir():
        raise ValueError(f'Нет каталога book-text в {root}')
    return root


def protected_files(root):
    files = list((root / 'src/content/book-text').glob('*.json'))
    toc = root / 'src/content/toc.ts'
    if toc.is_file():
        files.append(toc)
    return sorted(files)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def inventory(root):
    return {p.relative_to(root).as_posix(): digest(p) for p in protected_files(root)}


def snapshot(root, destination):
    path = Path(destination).resolve()
    frozen = root / 'src/content/book-text'
    if path.is_relative_to(frozen) or path == root / 'src/content/toc.ts':
        raise ValueError('Снимок нельзя записывать в защищённые исходники.')
    files = inventory(root)
    if not any(name.startswith('src/content/book-text/') for name in files):
        raise ValueError('Нельзя создать снимок: исходные JSON отсутствуют.')
    if 'src/content/toc.ts' not in files:
        raise ValueError('Нельзя создать снимок: отсутствует toc.ts.')
    data = {'version': 1, 'root': str(root), 'files': files}
    # Exclusive create: a later run must not silently replace the baseline.
    with path.open('x', encoding='utf-8') as stream:
        json.dump(data, stream, ensure_ascii=False, indent=2)
        stream.write('\n')
    return {'snapshot': str(path), 'protected_files': len(files)}


def verify(root, source):
    before = json.loads(Path(source).read_text(encoding='utf-8'))
    if before.get('version') != 1 or before.get('root') != str(root):
        raise ValueError('Снимок имеет неподдерживаемый формат или относится к другому проекту.')
    baseline = before.get('files')
    if not isinstance(baseline, dict) or not baseline:
        raise ValueError('В снимке отсутствует список защищённых файлов.')
    current = inventory(root)
    changed = sorted(p for p in baseline.keys() & current.keys() if baseline[p] != current[p])
    added = sorted(current.keys() - baseline.keys())
    removed = sorted(baseline.keys() - current.keys())
    return {'ok': not (changed or added or removed), 'changed': changed,
            'added': added, 'removed': removed, 'protected_files': len(current)}


def context(root, entry_id):
    matches = []
    for path in sorted((root / 'src/content/book-text').glob('*.json')):
        entries = json.loads(path.read_text(encoding='utf-8'))
        if not isinstance(entries, list):
            raise ValueError(f'{path}: ожидался массив записей')
        matches.extend((path, e) for e in entries if isinstance(e, dict) and e.get('id') == entry_id)
    if len(matches) != 1:
        raise ValueError(f'Ожидалась одна запись {entry_id}; найдено {len(matches)}.')
    path, entry = matches[0]
    paragraphs = []
    for index, p in enumerate(entry['paragraphs']):
        ref = f'{entry_id}:p{index}'
        if isinstance(p, str):
            item = {'ref': ref, 'kind': 'paragraph', 'text': p}
        elif isinstance(p, dict) and 'verse' in p:
            item = {'ref': ref, 'kind': 'verse', 'lines': [
                {'ref': f'{ref}:v{i}', 'text': line} for i, line in enumerate(p['verse'])]}
        elif isinstance(p, dict) and 'center' in p:
            item = {'ref': ref, 'kind': 'center', 'text': p['center']}
        else:
            raise ValueError(f'{ref}: неподдерживаемый вид абзаца; нельзя молча пропустить.')
        paragraphs.append(item)
    links_path = root / 'src/content/chapter-links.json'
    links = json.loads(links_path.read_text(encoding='utf-8')) if links_path.exists() else {}
    return {'entry_id': entry_id, 'title': entry['title'], 'marker': entry.get('marker'),
            'entry_pages': [entry['page'], entry['pageEnd']],
            'source_file': path.relative_to(root).as_posix(), 'source_sha256': digest(path),
            'canonical_chapter_id': links.get(entry_id),
            'historical_chapter_id_in_frozen_json': entry.get('chapterId'),
            'paragraphs': paragraphs,
            'footnotes': [{'ref': f"{entry_id}:fn{f['n']}", **f} for f in entry['footnotes']]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', help='Project root; defaults to discovery from cwd or this skill')
    commands = parser.add_subparsers(dest='command', required=True)
    commands.add_parser('context', help='Read the entire entry without truncating').add_argument('entry_id')
    commands.add_parser('snapshot', help='Create a fresh source baseline').add_argument('--out', required=True)
    commands.add_parser('verify', help='Compare source bytes to baseline').add_argument('--snapshot', required=True)
    args = parser.parse_args()
    try:
        root = find_root(args.root)
        if args.command == 'context':
            result = context(root, args.entry_id)
        elif args.command == 'snapshot':
            result = snapshot(root, args.out)
        else:
            result = verify(root, args.snapshot)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 1 if result.get('ok') is False else 0
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(f'Ошибка: {error}', file=sys.stderr)
        return 2


if __name__ == '__main__':
    sys.exit(main())
