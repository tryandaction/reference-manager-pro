/**
 * bibParser 单元测试
 * Requirements: 3.1
 */

import { describe, it, expect } from 'vitest';
import {
    parseBibFile,
    parseSingleEntry,
    serializeBibEntry,
    getEntryDescription,
    findEntryByKey,
    extractKeysFromEntries
} from '../../bibParser';

describe('bibParser', () => {
    describe('parseBibFile', () => {
        it('should parse a single article entry', () => {
            const content = `@article{einstein1905,
                author = {Einstein, Albert},
                title = {On the Electrodynamics of Moving Bodies},
                journal = {Annalen der Physik},
                year = {1905}
            }`;

            const result = parseBibFile(content);

            expect(result.entries).toHaveLength(1);
            expect(result.entries[0]!.type).toBe('article');
            expect(result.entries[0]!.key).toBe('einstein1905');
            expect(result.entries[0]!.fields.author).toBe('Einstein, Albert');
            expect(result.entries[0]!.fields.title).toBe('On the Electrodynamics of Moving Bodies');
            expect(result.entries[0]!.fields.year).toBe('1905');
        });

        it('should parse multiple entries', () => {
            const content = `
                @article{entry1, author = {Author One}, title = {Title One}, year = {2020}}
                @book{entry2, author = {Author Two}, title = {Title Two}, year = {2021}}
                @inproceedings{entry3, author = {Author Three}, title = {Title Three}, year = {2022}}
            `;

            const result = parseBibFile(content);

            expect(result.entries).toHaveLength(3);
            expect(result.entries[0]!.key).toBe('entry1');
            expect(result.entries[1]!.key).toBe('entry2');
            expect(result.entries[2]!.key).toBe('entry3');
        });

        it('should handle nested braces in title', () => {
            const content = `@article{test,
                author = {Smith, John},
                title = {A {Novel} Approach to {Machine Learning}},
                year = {2023}
            }`;

            const result = parseBibFile(content);

            expect(result.entries).toHaveLength(1);
            expect(result.entries[0]!.fields.title).toBe('A {Novel} Approach to {Machine Learning}');
        });

        it('should handle multiline field values', () => {
            const content = `@article{multiline,
                author = {Smith, John and
                          Doe, Jane and
                          Brown, Bob},
                title = {A Very Long Title That
                         Spans Multiple Lines},
                year = {2023}
            }`;

            const result = parseBibFile(content);

            expect(result.entries).toHaveLength(1);
            expect(result.entries[0]!.fields.author).toContain('Smith, John');
            expect(result.entries[0]!.fields.author).toContain('Doe, Jane');
        });

        it('should handle empty content', () => {
            const result = parseBibFile('');
            expect(result.entries).toHaveLength(0);
            expect(result.warnings).toHaveLength(0);
        });

        it('should handle content with only comments', () => {
            const content = `% This is a comment
            % Another comment`;

            const result = parseBibFile(content);
            expect(result.entries).toHaveLength(0);
        });

        it('should handle quoted field values', () => {
            const content = `@article{quoted,
                author = "Smith, John",
                title = "A Simple Title",
                year = 2023
            }`;

            const result = parseBibFile(content);

            expect(result.entries).toHaveLength(1);
            expect(result.entries[0]!.fields.author).toBe('Smith, John');
        });
    });

    describe('parseSingleEntry', () => {
        it('should parse a single entry', () => {
            const text = '@article{key, author = {Test Author}, title = {Test Title}}';
            const entry = parseSingleEntry(text);

            expect(entry).not.toBeNull();
            expect(entry!.key).toBe('key');
            expect(entry!.fields.author).toBe('Test Author');
        });

        it('should return null for invalid input', () => {
            const entry = parseSingleEntry('not a bibtex entry');
            expect(entry).toBeNull();
        });
    });

    describe('serializeBibEntry', () => {
        it('should serialize entry back to BibTeX format', () => {
            const entry = {
                type: 'article',
                key: 'test2023',
                fields: {
                    author: 'Test Author',
                    title: 'Test Title',
                    year: '2023'
                },
                rawText: '',
                startLine: 0,
                endLine: 0
            };

            const serialized = serializeBibEntry(entry);

            expect(serialized).toContain('@article{test2023,');
            expect(serialized).toContain('author = {Test Author}');
            expect(serialized).toContain('title = {Test Title}');
            expect(serialized).toContain('year = {2023}');
        });
    });

    describe('getEntryDescription', () => {
        it('should return formatted description', () => {
            const entry = {
                type: 'article',
                key: 'test',
                fields: {
                    author: 'Einstein, Albert',
                    title: 'On the Electrodynamics of Moving Bodies'
                },
                rawText: '',
                startLine: 0,
                endLine: 0
            };

            const desc = getEntryDescription(entry);

            expect(desc).toContain('Einstein, Albert');
            expect(desc).toContain('On the Electrodynamics');
        });

        it('should truncate long titles', () => {
            const entry = {
                type: 'article',
                key: 'test',
                fields: {
                    author: 'Author',
                    title: 'A'.repeat(100)
                },
                rawText: '',
                startLine: 0,
                endLine: 0
            };

            const desc = getEntryDescription(entry);

            expect(desc.length).toBeLessThan(100);
            expect(desc).toContain('...');
        });

        it('should handle missing fields', () => {
            const entry = {
                type: 'article',
                key: 'test',
                fields: {},
                rawText: '',
                startLine: 0,
                endLine: 0
            };

            const desc = getEntryDescription(entry);

            expect(desc).toContain('Unknown author');
            expect(desc).toContain('Untitled');
        });
    });

    describe('findEntryByKey', () => {
        it('should find entry by key', () => {
            const entries = [
                { type: 'article', key: 'a', fields: {}, rawText: '', startLine: 0, endLine: 0 },
                { type: 'book', key: 'b', fields: {}, rawText: '', startLine: 0, endLine: 0 },
                { type: 'misc', key: 'c', fields: {}, rawText: '', startLine: 0, endLine: 0 }
            ];

            const found = findEntryByKey(entries, 'b');

            expect(found).toBeDefined();
            expect(found!.type).toBe('book');
        });

        it('should return undefined for non-existent key', () => {
            const entries = [
                { type: 'article', key: 'a', fields: {}, rawText: '', startLine: 0, endLine: 0 }
            ];

            const found = findEntryByKey(entries, 'nonexistent');

            expect(found).toBeUndefined();
        });
    });

    describe('extractKeysFromEntries', () => {
        it('should extract all keys', () => {
            const entries = [
                { type: 'article', key: 'key1', fields: {}, rawText: '', startLine: 0, endLine: 0 },
                { type: 'book', key: 'key2', fields: {}, rawText: '', startLine: 0, endLine: 0 },
                { type: 'misc', key: 'key3', fields: {}, rawText: '', startLine: 0, endLine: 0 }
            ];

            const keys = extractKeysFromEntries(entries);

            expect(keys).toEqual(['key1', 'key2', 'key3']);
        });
    });
});
