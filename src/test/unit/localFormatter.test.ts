/**
 * localFormatter.ts 单元测试
 *
 * 测试本地离线格式化功能
 */

import { describe, it, expect } from 'vitest';
import { formatBibEntryLocal } from '../../localFormatter';

describe('Local Formatter', () => {
    describe('formatBibEntryLocal', () => {
        it('should format a simple entry', () => {
            const input = `@article{key2023,
  title={Test Title},
  author={John Doe},
  year={2023}
}`;
            const result = formatBibEntryLocal(input);

            expect(result).toContain('@article{key2023,');
            expect(result).toContain('author = {John Doe}');
            expect(result).toContain('title = {Test Title}');
            expect(result).toContain('year = {2023}');
        });

        it('should normalize field order', () => {
            const input = `@article{key2023,
  year={2023},
  title={Test Title},
  author={John Doe}
}`;
            const result = formatBibEntryLocal(input);
            const lines = result.split('\n');

            // author should come before title, title before year
            const authorIndex = lines.findIndex(l => l.includes('author'));
            const titleIndex = lines.findIndex(l => l.includes('title'));
            const yearIndex = lines.findIndex(l => l.includes('year'));

            expect(authorIndex).toBeLessThan(titleIndex);
            expect(titleIndex).toBeLessThan(yearIndex);
        });

        it('should fix common field name typos', () => {
            const input = `@article{key2023,
  autor={John Doe},
  titlee={Test Title},
  yer={2023}
}`;
            const result = formatBibEntryLocal(input);

            expect(result).toContain('author = {John Doe}');
            // titlee is not a known typo, so it stays as is
            // autor -> author, yer -> year
            expect(result).not.toContain('autor');
            expect(result).not.toContain('yer');
        });

        it('should remove excessive whitespace', () => {
            const input = `@article{key2023,
  title={Test    Title   with   spaces},
  author={John    Doe}
}`;
            const result = formatBibEntryLocal(input);

            expect(result).toContain('title = {Test Title with spaces}');
            expect(result).toContain('author = {John Doe}');
        });

        it('should handle entries with double quotes', () => {
            const input = `@article{key2023,
  title="Test Title",
  author="John Doe"
}`;
            const result = formatBibEntryLocal(input);

            expect(result).toContain('title = {Test Title}');
            expect(result).toContain('author = {John Doe}');
        });

        it('should return original if cannot parse', () => {
            const input = 'not a valid bibtex entry';
            const result = formatBibEntryLocal(input);

            expect(result).toBe(input);
        });

        it('should handle nested braces in values', () => {
            const input = `@article{key2023,
  title={Test {Title} with {Braces}},
  author={John Doe}
}`;
            const result = formatBibEntryLocal(input);

            expect(result).toContain('title = {Test {Title} with {Braces}}');
        });

        it('should preserve entry type case', () => {
            const input = `@Article{key2023,
  title={Test},
  author={John}
}`;
            const result = formatBibEntryLocal(input);

            expect(result).toContain('@article{key2023,');
        });

        it('should handle all standard fields', () => {
            const input = `@article{key2023,
  note={Some note},
  doi={10.1234/test},
  pages={1-10},
  volume={1},
  journal={Test Journal},
  year={2023},
  title={Test Title},
  author={John Doe}
}`;
            const result = formatBibEntryLocal(input);
            const lines = result.split('\n');

            // Check order: author, title, journal, year, volume, pages, doi, note
            const authorIndex = lines.findIndex(l => l.includes('author'));
            const titleIndex = lines.findIndex(l => l.includes('title'));
            const journalIndex = lines.findIndex(l => l.includes('journal'));
            const yearIndex = lines.findIndex(l => l.includes('year'));
            const volumeIndex = lines.findIndex(l => l.includes('volume'));
            const pagesIndex = lines.findIndex(l => l.includes('pages'));
            const doiIndex = lines.findIndex(l => l.includes('doi'));
            const noteIndex = lines.findIndex(l => l.includes('note'));

            expect(authorIndex).toBeLessThan(titleIndex);
            expect(titleIndex).toBeLessThan(journalIndex);
            expect(journalIndex).toBeLessThan(yearIndex);
            expect(yearIndex).toBeLessThan(volumeIndex);
            expect(volumeIndex).toBeLessThan(pagesIndex);
            expect(pagesIndex).toBeLessThan(doiIndex);
            expect(doiIndex).toBeLessThan(noteIndex);
        });
    });
});
