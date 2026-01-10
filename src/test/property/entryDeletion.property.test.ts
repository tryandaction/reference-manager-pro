/**
 * Entry Deletion 属性测试
 * Property 6: Entry Deletion Preserves Other Entries
 * Validates: Requirements 2.6, 3.5
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { parseBibFile } from '../../bibParser';
import { arbitraryBibEntry, arbitraryUniqueBibEntries } from './generators';

/**
 * 模拟删除条目的函数
 */
function deleteEntry(content: string, entryToDelete: string): string {
    return content.replace(entryToDelete, '').replace(/\n{3,}/g, '\n\n');
}

describe('Entry Deletion Properties', () => {
    /**
     * Property 6: Entry Deletion Preserves Other Entries
     * For any .bib file content and entry to delete, removing that entry
     * should preserve all other entries unchanged.
     */
    it('Property 6: Deleting one entry preserves others', () => {
        fc.assert(
            fc.property(
                arbitraryUniqueBibEntries(2, 5),
                fc.integer({ min: 0, max: 4 }),
                (entries, deleteIndex) => {
                    // Ensure deleteIndex is valid
                    const idx = deleteIndex % entries.length;

                    // Create content with all entries
                    const content = entries.map(e => e.rawText).join('\n\n');

                    // Parse original
                    const originalParsed = parseBibFile(content);
                    const originalKeys = originalParsed.entries.map(e => e.key);

                    // Delete one entry
                    const entryToDelete = entries[idx]!;
                    const newContent = deleteEntry(content, entryToDelete.rawText);

                    // Parse after deletion
                    const newParsed = parseBibFile(newContent);
                    const newKeys = newParsed.entries.map(e => e.key);

                    // Should have one less entry
                    expect(newParsed.entries.length).toBe(originalParsed.entries.length - 1);

                    // Deleted key should not be present
                    expect(newKeys).not.toContain(entryToDelete.key);

                    // All other keys should still be present
                    for (const key of originalKeys) {
                        if (key !== entryToDelete.key) {
                            expect(newKeys).toContain(key);
                        }
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 6 (continued): Deleting multiple entries preserves remaining
     */
    it('Property 6: Deleting multiple entries preserves remaining', () => {
        fc.assert(
            fc.property(
                arbitraryUniqueBibEntries(3, 6),
                fc.integer({ min: 1, max: 2 }),
                (entries, deleteCount) => {
                    // Create content
                    let content = entries.map(e => e.rawText).join('\n\n');

                    // Delete first N entries
                    const toDelete = entries.slice(0, deleteCount);
                    const toKeep = entries.slice(deleteCount);

                    for (const entry of toDelete) {
                        content = deleteEntry(content, entry.rawText);
                    }

                    // Parse after deletion
                    const parsed = parseBibFile(content);
                    const remainingKeys = parsed.entries.map(e => e.key);

                    // Should have correct number of entries
                    expect(parsed.entries.length).toBe(toKeep.length);

                    // All kept entries should be present
                    for (const entry of toKeep) {
                        expect(remainingKeys).toContain(entry.key);
                    }

                    // Deleted entries should not be present
                    for (const entry of toDelete) {
                        expect(remainingKeys).not.toContain(entry.key);
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 6 (continued): Field values are preserved after deletion
     * Note: Whitespace-only values may be cleaned during parsing
     */
    it('Property 6: Field values of remaining entries are preserved', () => {
        fc.assert(
            fc.property(
                arbitraryUniqueBibEntries(2, 4),
                (entries) => {
                    // Create content
                    const content = entries.map(e => e.rawText).join('\n\n');

                    // Delete first entry
                    const entryToDelete = entries[0]!;
                    const newContent = deleteEntry(content, entryToDelete.rawText);

                    // Parse after deletion
                    const parsed = parseBibFile(newContent);

                    // Check remaining entries have correct fields
                    for (let i = 1; i < entries.length; i++) {
                        const original = entries[i]!;
                        const remaining = parsed.entries.find(e => e.key === original.key);

                        expect(remaining).toBeDefined();
                        expect(remaining!.type).toBe(original.type);

                        // Check fields - whitespace-only values may be cleaned
                        if (original.fields.author && original.fields.author.trim()) {
                            expect(remaining!.fields.author).toBe(original.fields.author);
                        }
                        if (original.fields.title && original.fields.title.trim()) {
                            expect(remaining!.fields.title).toBe(original.fields.title);
                        }
                        if (original.fields.year && original.fields.year.trim()) {
                            expect(remaining!.fields.year).toBe(original.fields.year);
                        }
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Deleting all entries results in empty file
     */
    it('Property: Deleting all entries results in no entries', () => {
        fc.assert(
            fc.property(
                fc.array(arbitraryBibEntry, { minLength: 1, maxLength: 3 }),
                (entries) => {
                    let content = entries.map(e => e.rawText).join('\n\n');

                    // Delete all entries
                    for (const entry of entries) {
                        content = deleteEntry(content, entry.rawText);
                    }

                    // Parse after deletion
                    const parsed = parseBibFile(content);

                    expect(parsed.entries.length).toBe(0);

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });
});
