/**
 * bibParser 属性测试
 * Property 1: BibTeX Parsing Round Trip
 * Validates: Requirements 3.1
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { parseBibFile, parseSingleEntry, serializeBibEntry } from '../../bibParser';
import { arbitraryBibEntry, arbitraryCitationKey, arbitraryBibType, arbitrarySimpleFieldValue, arbitraryYear } from './generators';

describe('BibTeX Parser Properties', () => {
    /**
     * Property 1: Round trip preserves entry data
     * For any valid BibTeX entry, parsing it with parseBibFile() and then
     * serializing with serializeBibEntry() should produce a semantically
     * equivalent entry (same type, key, and field values).
     * 
     * Note: Field values that are pure whitespace may be cleaned during parsing,
     * so we only test with non-whitespace field values.
     */
    it('Property 1: Round trip preserves entry data', () => {
        fc.assert(
            fc.property(
                arbitraryBibEntry,
                (entry) => {
                    // Serialize the entry
                    const serialized = serializeBibEntry(entry);

                    // Parse it back
                    const parsed = parseSingleEntry(serialized);

                    // Verify semantic equivalence
                    expect(parsed).not.toBeNull();
                    expect(parsed!.type).toBe(entry.type);
                    expect(parsed!.key).toBe(entry.key);

                    // Check fields - note that whitespace-only values may be cleaned
                    if (entry.fields.author && entry.fields.author.trim()) {
                        expect(parsed!.fields.author).toBe(entry.fields.author);
                    }
                    if (entry.fields.title && entry.fields.title.trim()) {
                        expect(parsed!.fields.title).toBe(entry.fields.title);
                    }
                    if (entry.fields.year && entry.fields.year.trim()) {
                        expect(parsed!.fields.year).toBe(entry.fields.year);
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Parsing preserves all entries
     * For any collection of valid BibTeX entries, parsing should return
     * the same number of entries.
     */
    it('Property: Parsing preserves entry count', () => {
        fc.assert(
            fc.property(
                fc.array(arbitraryBibEntry, { minLength: 1, maxLength: 5 }),
                (entries) => {
                    // Create content with all entries
                    const content = entries.map(e => e.rawText).join('\n\n');

                    // Parse
                    const result = parseBibFile(content);

                    // Should have same number of entries
                    expect(result.entries.length).toBe(entries.length);

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Keys are preserved exactly
     * For any valid citation key, parsing should preserve it exactly.
     */
    it('Property: Citation keys are preserved exactly', () => {
        fc.assert(
            fc.property(
                fc.tuple(arbitraryBibType, arbitraryCitationKey, arbitrarySimpleFieldValue, arbitraryYear),
                ([type, key, title, year]) => {
                    const content = `@${type}{${key}, title = {${title}}, year = {${year}}}`;
                    const result = parseBibFile(content);

                    expect(result.entries.length).toBe(1);
                    expect(result.entries[0]!.key).toBe(key);

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Entry type is normalized to lowercase
     * For any entry type (regardless of case), parsing should normalize to lowercase.
     */
    it('Property: Entry type is normalized to lowercase', () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.constantFrom('ARTICLE', 'Article', 'article', 'BOOK', 'Book', 'book'),
                    arbitraryCitationKey
                ),
                ([type, key]) => {
                    const content = `@${type}{${key}, title = {Test}}`;
                    const result = parseBibFile(content);

                    expect(result.entries.length).toBe(1);
                    expect(result.entries[0]!.type).toBe(type.toLowerCase());

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Empty or whitespace content produces no entries
     */
    it('Property: Empty or whitespace content produces no entries', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 0, maxLength: 20, unit: fc.constantFrom(' ', '\t', '\n', '\r') }),
                (whitespace: string) => {
                    const result = parseBibFile(whitespace);
                    expect(result.entries.length).toBe(0);
                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });
});
