"""Behavioral tests for the read-only source helper; all mutations use temporary fixtures."""
import json
import tempfile
import unittest
from pathlib import Path
from source_guard import context, snapshot, verify


class SourceGuardTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='fawaid-skill-test-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.frozen = self.root / 'src/content/book-text'
        self.frozen.mkdir(parents=True)
        self.path = self.frozen / 'p0.json'
        self.entry = {'id': 'e12', 'title': 'Проверка', 'marker': 'Раздел',
                      'page': 12, 'pageEnd': 15, 'chapterId': None,
                      'paragraphs': ['Точный текст ﷺ {{1}}', {'verse': ['Строка 1', 'Строка 2']},
                                     {'center': 'Центрированный текст'}],
                      'footnotes': [{'n': 1, 'text': 'Пояснение издания'}]}
        self.path.write_text(json.dumps([self.entry], ensure_ascii=False), encoding='utf-8')
        (self.root / 'src/content/toc.ts').write_text('export const TOC_PARTS = [];\n', encoding='utf-8')
        (self.root / 'src/content/chapter-links.json').write_text('{"e12":"ch3"}', encoding='utf-8')
        self.baseline = self.root / 'baseline.json'
        snapshot(self.root, self.baseline)

    def test_context_preserves_all_kinds_and_provenance_without_pdf(self):
        before = self.path.read_bytes()
        result = context(self.root, 'e12')
        self.assertEqual(result['paragraphs'][0]['text'], self.entry['paragraphs'][0])
        self.assertEqual(result['paragraphs'][1]['lines'][1], {'ref': 'e12:p1:v1', 'text': 'Строка 2'})
        self.assertEqual(result['paragraphs'][2]['text'], self.entry['paragraphs'][2]['center'])
        self.assertEqual(result['footnotes'][0]['ref'], 'e12:fn1')
        self.assertEqual(result['canonical_chapter_id'], 'ch3')
        self.assertIsNone(result['historical_chapter_id_in_frozen_json'])
        self.assertEqual(before, self.path.read_bytes())
        self.assertTrue(verify(self.root, self.baseline)['ok'])

    def test_verify_detects_even_whitespace_only_change(self):
        self.path.write_bytes(self.path.read_bytes() + b'\n')
        result = verify(self.root, self.baseline)
        self.assertFalse(result['ok'])
        self.assertEqual(result['changed'], ['src/content/book-text/p0.json'])

    def test_verify_detects_added_and_removed_sources(self):
        self.path.unlink()
        (self.frozen / 'p1.json').write_text('[]', encoding='utf-8')
        result = verify(self.root, self.baseline)
        self.assertEqual(result['removed'], ['src/content/book-text/p0.json'])
        self.assertEqual(result['added'], ['src/content/book-text/p1.json'])
        self.assertFalse(result['ok'])

    def test_verify_protects_toc_but_allows_editorial_changes(self):
        (self.root / 'src/content/chapter-links.json').write_text('{"e12":"ch4"}', encoding='utf-8')
        self.assertTrue(verify(self.root, self.baseline)['ok'])
        (self.root / 'src/content/toc.ts').write_text('changed', encoding='utf-8')
        self.assertEqual(verify(self.root, self.baseline)['changed'], ['src/content/toc.ts'])

    def test_snapshot_cannot_overwrite_baseline_or_frozen_files(self):
        with self.assertRaises(FileExistsError):
            snapshot(self.root, self.baseline)
        for path in [self.path, self.frozen / 'new.json', self.root / 'src/content/toc.ts']:
            with self.assertRaises(ValueError):
                snapshot(self.root, path)
        self.assertTrue(verify(self.root, self.baseline)['ok'])

    def test_unknown_or_duplicate_entry_is_not_silently_selected(self):
        with self.assertRaises(ValueError):
            context(self.root, 'e999')
        (self.frozen / 'p1.json').write_text(json.dumps([self.entry]), encoding='utf-8')
        with self.assertRaises(ValueError):
            context(self.root, 'e12')

    def test_another_root_cannot_use_this_baseline(self):
        other = self.root / 'other'
        (other / 'src/content/book-text').mkdir(parents=True)
        with self.assertRaises(ValueError):
            verify(other, self.baseline)


if __name__ == '__main__':
    unittest.main()
