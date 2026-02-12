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
            expect(result).toContain('author = {Doe, John}');
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

            expect(result).toContain('author = {Doe, John}');
            expect(result).toContain('year = {2023}');
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
            expect(result).toContain('author = {Doe, John}');
        });

        it('should handle entries with double quotes', () => {
            const input = `@article{key2023,
  title="Test Title",
  author="John Doe"
}`;
            const result = formatBibEntryLocal(input);

            expect(result).toContain('title = {Test Title}');
            expect(result).toContain('author = {Doe, John}');
        });

        it('should normalize BibLaTeX-style name-value authors and field aliases', () => {
            const input = `@article{key2015,
  author = {family=Bibber, given=K., prefix=van, useprefix=false and Doe, John},
  title = {Cavity Design for High-Frequency Axion Dark Matter Detectors},
  journaltitle = {Review of Scientific Instruments},
  date = {2015-12-01},
  issue = {12},
  pages = {123-130}
}`;
            const result = formatBibEntryLocal(input);

            expect(result).toContain('author = {van Bibber, K. and Doe, John}');
            expect(result).toContain('journal = {Rev. Sci. Instrum.}');  // ✅ 修正：期刊名会被缩写
            expect(result).toContain('year = {2015}');
            expect(result).toContain('month = {12}');
            expect(result).toContain('number = {12}');
            expect(result).toContain('pages = {123--130}');
        });

        it('should not double-expand page ranges already normalized', () => {
            const input = `@article{key2023,
  title={Test Title},
  author={John Doe},
  pages={123--130}
}`;
            const result = formatBibEntryLocal(input);

            expect(result).toContain('pages = {123--130}');
        });

        it('should return original if cannot parse', () => {
            const input = 'not a valid bibtex entry';
            const result = formatBibEntryLocal(input);

            expect(result).toBe(input);
        });

        it('should format multiple entries without dropping content', () => {
            const input = `@article{key2023,
  title={Test Title},
  author={John Doe},
  year={2023}
}@article{key2024,
  title={Another Title},
  author={Jane Doe},
  year={2024}
}`;
            const result = formatBibEntryLocal(input);

            expect(result.match(/@article\{/g)?.length).toBe(2);
            expect(result).toContain('@article{key2023,');
            expect(result).toContain('@article{key2024,');
            expect(result).toContain('author = {Doe, John}');
            expect(result).toContain('author = {Doe, Jane}');
        });

        it('should preserve non-entry text when formatting', () => {
            const input = `% Comment before
@article{key2023,
  title={Test Title},
  author={John Doe},
  year={2023}
}
% Comment after`;
            const result = formatBibEntryLocal(input);

            expect(result).toContain('% Comment before');
            expect(result).toContain('% Comment after');
            expect(result).toContain('author = {Doe, John}');
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
