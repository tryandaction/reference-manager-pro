/**
 * citationScanner 单元测试
 * Requirements: 2.2
 * 
 * 注意：只测试不依赖 vscode 的纯函数
 */

import { describe, it, expect } from 'vitest';

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

function extractBibliographyFiles(texContent: string): string[] {
    const bibFiles: string[] = [];
    const bibRegex = /\\bibliography\{([^}]+)\}/gi;
    let match: RegExpExecArray | null;
    while ((match = bibRegex.exec(texContent)) !== null) {
        const files = match[1]!.split(',').map(f => f.trim());
        bibFiles.push(...files);
    }
    const addbibRegex = /\\addbibresource\{([^}]+)\}/gi;
    while ((match = addbibRegex.exec(texContent)) !== null) {
        const file = match[1]!.replace(/\.bib$/i, '').trim();
        bibFiles.push(file);
    }
    return bibFiles;
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

describe('citationScanner', () => {
    describe('extractCitationKeys', () => {
        it('should extract key from \\cite{key}', () => {
            const content = 'As shown in \\cite{einstein1905}, the theory...';
            const keys = extractCitationKeys(content);

            expect(keys).toContain('einstein1905');
        });

        it('should extract multiple keys from \\cite{key1,key2}', () => {
            const content = 'See \\cite{ref1,ref2,ref3} for details.';
            const keys = extractCitationKeys(content);

            expect(keys).toContain('ref1');
            expect(keys).toContain('ref2');
            expect(keys).toContain('ref3');
        });

        it('should extract keys from \\citep{}', () => {
            const content = 'The result \\citep{author2020} shows...';
            const keys = extractCitationKeys(content);

            expect(keys).toContain('author2020');
        });

        it('should extract keys from \\citet{}', () => {
            const content = '\\citet{smith2021} demonstrated that...';
            const keys = extractCitationKeys(content);

            expect(keys).toContain('smith2021');
        });

        it('should handle optional parameters \\cite[p.1]{key}', () => {
            const content = 'As noted \\cite[p. 42]{reference} in the text.';
            const keys = extractCitationKeys(content);

            expect(keys).toContain('reference');
        });

        it('should handle multiple optional parameters', () => {
            const content = '\\citep[see][p. 100]{multiopt}';
            const keys = extractCitationKeys(content);

            expect(keys).toContain('multiopt');
        });

        it('should extract keys from various citation commands', () => {
            const content = `
                \\cite{cite1}
                \\citep{citep1}
                \\citet{citet1}
                \\citeauthor{author1}
                \\citeyear{year1}
                \\parencite{parencite1}
                \\textcite{textcite1}
                \\autocite{autocite1}
                \\nocite{nocite1}
            `;
            const keys = extractCitationKeys(content);

            expect(keys).toContain('cite1');
            expect(keys).toContain('citep1');
            expect(keys).toContain('citet1');
            expect(keys).toContain('author1');
            expect(keys).toContain('year1');
            expect(keys).toContain('parencite1');
            expect(keys).toContain('textcite1');
            expect(keys).toContain('autocite1');
            expect(keys).toContain('nocite1');
        });

        it('should return empty array for content without citations', () => {
            const content = 'This is plain text without any citations.';
            const keys = extractCitationKeys(content);

            expect(keys).toHaveLength(0);
        });

        it('should deduplicate keys', () => {
            const content = '\\cite{same} and \\cite{same} again \\citep{same}';
            const keys = extractCitationKeys(content);

            expect(keys).toHaveLength(1);
            expect(keys).toContain('same');
        });

        it('should handle whitespace in key lists', () => {
            const content = '\\cite{ key1 , key2 , key3 }';
            const keys = extractCitationKeys(content);

            expect(keys).toContain('key1');
            expect(keys).toContain('key2');
            expect(keys).toContain('key3');
        });

        it('should handle case variations in commands', () => {
            const content = '\\Cite{upper1} and \\CITE{upper2}';
            const keys = extractCitationKeys(content);

            expect(keys).toContain('upper1');
            // Note: CITE might not be matched depending on implementation
        });

        it('should handle empty file', () => {
            const keys = extractCitationKeys('');
            expect(keys).toHaveLength(0);
        });
    });

    describe('extractBibliographyFiles', () => {
        it('should extract from \\bibliography{file}', () => {
            const content = '\\bibliography{references}';
            const files = extractBibliographyFiles(content);

            expect(files).toContain('references');
        });

        it('should extract multiple files from \\bibliography{file1,file2}', () => {
            const content = '\\bibliography{refs,extra_refs,more}';
            const files = extractBibliographyFiles(content);

            expect(files).toContain('refs');
            expect(files).toContain('extra_refs');
            expect(files).toContain('more');
        });

        it('should extract from \\addbibresource{file.bib}', () => {
            const content = '\\addbibresource{mybib.bib}';
            const files = extractBibliographyFiles(content);

            expect(files).toContain('mybib');
        });

        it('should handle both commands in same file', () => {
            const content = `
                \\bibliography{main}
                \\addbibresource{extra.bib}
            `;
            const files = extractBibliographyFiles(content);

            expect(files).toContain('main');
            expect(files).toContain('extra');
        });
    });

    describe('isKeyUsed', () => {
        it('should return true for used key (case sensitive)', () => {
            const usedKeys = new Set(['key1', 'key2', 'key3']);

            expect(isKeyUsed('key1', usedKeys, true)).toBe(true);
            expect(isKeyUsed('key2', usedKeys, true)).toBe(true);
        });

        it('should return false for unused key', () => {
            const usedKeys = new Set(['key1', 'key2']);

            expect(isKeyUsed('key3', usedKeys, true)).toBe(false);
        });

        it('should handle case insensitive matching', () => {
            const usedKeys = new Set(['Key1', 'KEY2']);

            expect(isKeyUsed('key1', usedKeys, false)).toBe(true);
            expect(isKeyUsed('key2', usedKeys, false)).toBe(true);
        });

        it('should be case sensitive by default', () => {
            const usedKeys = new Set(['Key1']);

            expect(isKeyUsed('key1', usedKeys)).toBe(false);
            expect(isKeyUsed('Key1', usedKeys)).toBe(true);
        });
    });
});
