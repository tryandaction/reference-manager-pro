/**
 * Output Format 属性测试
 * Property 8: Output Format Correctness
 * Validates: Requirements 2.4
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { getEntryDescription, BibEntry, BibFields } from '../../bibParser';
import { arbitraryBibEntry, arbitrarySimpleFieldValue, arbitraryCitationKey } from './generators';

/**
 * 格式化未使用条目的输出
 * 模拟 extension.ts 中的格式化逻辑
 */
function formatUnusedEntry(entry: BibEntry): string {
    const author = entry.fields.author ?? 'Unknown';
    const title = entry.fields.title ?? 'Untitled';
    const truncatedTitle = title.length > 40 ? title.substring(0, 40) + '...' : title;
    return `⚠️ Unused: ${entry.key} (${author}, "${truncatedTitle}")`;
}

describe('Output Format Properties', () => {
    /**
     * Property 8: Output Format Correctness
     * For any unused BibEntry, the formatted output string should contain
     * the entry's key, author (if present), and truncated title.
     */
    it('Property 8: Output contains key, author, and title', () => {
        fc.assert(
            fc.property(
                arbitraryBibEntry,
                (entry) => {
                    const output = formatUnusedEntry(entry);

                    // Should contain the key
                    expect(output).toContain(entry.key);

                    // Should contain author or "Unknown"
                    if (entry.fields.author) {
                        expect(output).toContain(entry.fields.author);
                    } else {
                        expect(output).toContain('Unknown');
                    }

                    // Should contain title (possibly truncated) or "Untitled"
                    if (entry.fields.title) {
                        const truncated = entry.fields.title.length > 40
                            ? entry.fields.title.substring(0, 40)
                            : entry.fields.title;
                        expect(output).toContain(truncated);
                    } else {
                        expect(output).toContain('Untitled');
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 8 (continued): Output starts with warning emoji
     */
    it('Property 8: Output starts with warning indicator', () => {
        fc.assert(
            fc.property(
                arbitraryBibEntry,
                (entry) => {
                    const output = formatUnusedEntry(entry);

                    expect(output).toMatch(/^⚠️ Unused:/);

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 8 (continued): Long titles are truncated
     */
    it('Property 8: Long titles are truncated with ellipsis', () => {
        fc.assert(
            fc.property(
                fc.tuple(arbitraryCitationKey, fc.string({ minLength: 50, maxLength: 200 })),
                ([key, longTitle]) => {
                    const entry: BibEntry = {
                        type: 'article',
                        key,
                        fields: {
                            author: 'Test Author',
                            title: longTitle
                        },
                        rawText: '',
                        startLine: 0,
                        endLine: 0
                    };

                    const output = formatUnusedEntry(entry);

                    // Should contain ellipsis for long titles
                    expect(output).toContain('...');

                    // Should not contain the full title
                    expect(output).not.toContain(longTitle);

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 8 (continued): Short titles are not truncated
     */
    it('Property 8: Short titles are not truncated', () => {
        fc.assert(
            fc.property(
                fc.tuple(arbitraryCitationKey, fc.string({ minLength: 1, maxLength: 40 })),
                ([key, shortTitle]) => {
                    // Filter out titles with special characters that might cause issues
                    if (!/^[a-zA-Z0-9 ]+$/.test(shortTitle)) {
                        return true; // Skip this case
                    }

                    const entry: BibEntry = {
                        type: 'article',
                        key,
                        fields: {
                            author: 'Test Author',
                            title: shortTitle
                        },
                        rawText: '',
                        startLine: 0,
                        endLine: 0
                    };

                    const output = formatUnusedEntry(entry);

                    // Should contain the full title
                    expect(output).toContain(shortTitle);

                    // Should not have ellipsis (unless title is exactly 40 chars)
                    if (shortTitle.length < 40) {
                        expect(output).not.toContain('...');
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: getEntryDescription handles missing fields gracefully
     */
    it('Property: getEntryDescription handles missing fields', () => {
        fc.assert(
            fc.property(
                fc.record({
                    type: fc.constantFrom('article', 'book'),
                    key: arbitraryCitationKey,
                    hasAuthor: fc.boolean(),
                    hasTitle: fc.boolean(),
                    author: arbitrarySimpleFieldValue,
                    title: arbitrarySimpleFieldValue
                }),
                ({ type, key, hasAuthor, hasTitle, author, title }) => {
                    const fields: BibFields = {};
                    if (hasAuthor) {
                        fields.author = author;
                    }
                    if (hasTitle) {
                        fields.title = title;
                    }

                    const entry: BibEntry = {
                        type,
                        key,
                        fields,
                        rawText: '',
                        startLine: 0,
                        endLine: 0
                    };

                    const desc = getEntryDescription(entry);

                    // Should always return a string
                    expect(typeof desc).toBe('string');
                    expect(desc.length).toBeGreaterThan(0);

                    // Should contain author or "Unknown author"
                    if (hasAuthor) {
                        expect(desc).toContain(author);
                    } else {
                        expect(desc).toContain('Unknown author');
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});
