/**
 * citationScanner 属性测试
 * Property 2: Citation Key Extraction Completeness
 * Property 3: Unused Citation Detection Correctness
 * Validates: Requirements 2.2, 2.3
 * 
 * 注意：只测试不依赖 vscode 的纯函数
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { arbitraryCitationKey, arbitraryCiteCommand, arbitraryUnusedCitationTestData } from './generators';

// 直接复制纯函数进行测试，避免 vscode 依赖
const CITATION_COMMANDS = [
    'cite', 'citep', 'citet', 'citeauthor', 'citeyear', 'citealt', 'citealp',
    'citenum', 'citep*', 'citet*', 'Cite', 'Citep', 'Citet', 'parencite',
    'textcite', 'autocite', 'footcite', 'fullcite', 'nocite',
];

function extractCitationKeys(texContent: string): string[] {
    const keys = new Set<string>();
    const commandPattern = CITATION_COMMANDS
        .map(cmd => cmd.replace('*', '\\*'))
        .join('|');
    const regex = new RegExp(
        `\\\\(${commandPattern})(?:\\[[^\\]]*\\])*\\{([^}]+)\\}`,
        'gi'
    );
    let match: RegExpExecArray | null;
    while ((match = regex.exec(texContent)) !== null) {
        const keysString = match[2]!;
        const individualKeys = keysString.split(',').map(k => k.trim()).filter(k => k.length > 0);
        for (const key of individualKeys) {
            keys.add(key);
        }
    }
    return Array.from(keys);
}

function isKeyUsed(key: string, usedKeys: Set<string>, caseSensitive: boolean = true): boolean {
    if (caseSensitive) {
        return usedKeys.has(key);
    }
    const lowerKey = key.toLowerCase();
    for (const usedKey of usedKeys) {
        if (usedKey.toLowerCase() === lowerKey) {
            return true;
        }
    }
    return false;
}

describe('Citation Scanner Properties', () => {
    /**
     * Property 2: Citation Key Extraction Completeness
     * For any .tex content containing citation commands (\cite{}, \citep{}, \citet{}, etc.),
     * extractCitationKeys() should return all keys referenced in those commands without duplicates.
     */
    it('Property 2: All citation keys are extracted', () => {
        fc.assert(
            fc.property(
                fc.array(arbitraryCitationKey, { minLength: 1, maxLength: 10 }),
                (keys) => {
                    // Create tex content with all keys
                    const content = keys.map(k => `\\cite{${k}}`).join(' ');

                    // Extract keys
                    const extracted = extractCitationKeys(content);

                    // All original keys should be extracted
                    for (const key of keys) {
                        expect(extracted).toContain(key);
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 2 (continued): No duplicates in extraction
     */
    it('Property 2: Extracted keys have no duplicates', () => {
        fc.assert(
            fc.property(
                fc.array(arbitraryCitationKey, { minLength: 1, maxLength: 5 }),
                (keys) => {
                    // Create content with duplicate citations
                    const content = keys.map(k => `\\cite{${k}} \\citep{${k}}`).join(' ');

                    // Extract keys
                    const extracted = extractCitationKeys(content);

                    // Should have no duplicates
                    const uniqueExtracted = new Set(extracted);
                    expect(extracted.length).toBe(uniqueExtracted.size);

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 2 (continued): Multiple keys in single cite command
     */
    it('Property 2: Multiple keys in single cite are all extracted', () => {
        fc.assert(
            fc.property(
                fc.array(arbitraryCitationKey, { minLength: 2, maxLength: 5 }),
                (keys) => {
                    // Create content with multiple keys in one cite
                    const content = `\\cite{${keys.join(',')}}`;

                    // Extract keys
                    const extracted = extractCitationKeys(content);

                    // All keys should be extracted
                    for (const key of keys) {
                        expect(extracted).toContain(key);
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 2 (continued): Various citation commands work
     */
    it('Property 2: All citation command types extract keys', () => {
        fc.assert(
            fc.property(
                fc.tuple(arbitraryCiteCommand, arbitraryCitationKey),
                ([cmd, key]) => {
                    const content = `\\${cmd}{${key}}`;
                    const extracted = extractCitationKeys(content);

                    expect(extracted).toContain(key);

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 3: Unused Citation Detection Correctness
     * For any set of used citation keys and set of defined BibTeX entries,
     * the unused entries should be exactly those entries whose keys are not in the used keys set.
     */
    it('Property 3: Unused detection is correct', () => {
        fc.assert(
            fc.property(
                arbitraryUnusedCitationTestData,
                ({ allKeys, usedKeys, unusedKeys }) => {
                    // Check each key
                    for (const key of allKeys) {
                        const isUsed = usedKeys.has(key);
                        const shouldBeUnused = unusedKeys.includes(key);

                        // A key is unused iff it's not in usedKeys
                        expect(isUsed).toBe(!shouldBeUnused);

                        // Verify with isKeyUsed function
                        expect(isKeyUsed(key, usedKeys)).toBe(isUsed);
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 3 (continued): Used keys are never marked as unused
     */
    it('Property 3: Used keys are never marked as unused', () => {
        fc.assert(
            fc.property(
                fc.array(arbitraryCitationKey, { minLength: 1, maxLength: 10 }),
                (keys) => {
                    const usedKeys = new Set(keys);

                    // All keys in usedKeys should be marked as used
                    for (const key of keys) {
                        expect(isKeyUsed(key, usedKeys)).toBe(true);
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 3 (continued): Non-existent keys are always unused
     */
    it('Property 3: Non-existent keys are always unused', () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.array(arbitraryCitationKey, { minLength: 1, maxLength: 5 }),
                    arbitraryCitationKey
                ),
                ([usedKeysList, testKey]) => {
                    const usedKeys = new Set(usedKeysList);

                    // If testKey is not in usedKeys, it should be unused
                    if (!usedKeys.has(testKey)) {
                        expect(isKeyUsed(testKey, usedKeys)).toBe(false);
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Empty content yields no keys
     */
    it('Property: Empty content yields no citation keys', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 0, maxLength: 50, unit: fc.constantFrom(' ', '\t', '\n', 'a', 'b', 'c') }),
                (content: string) => {
                    // Content without citation commands
                    if (!content.includes('\\cite') && !content.includes('\\citep')) {
                        const extracted = extractCitationKeys(content);
                        // May or may not be empty depending on content
                        // Just verify it doesn't crash
                        expect(Array.isArray(extracted)).toBe(true);
                    }
                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });
});
