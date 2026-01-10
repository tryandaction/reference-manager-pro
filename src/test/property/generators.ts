/**
 * 自定义生成器 - 用于属性测试
 */

import fc from 'fast-check';
import { BibEntry, BibFields } from '../../bibParser';

/**
 * 生成有效的 BibTeX 条目类型
 */
export const arbitraryBibType = fc.constantFrom(
    'article',
    'book',
    'inproceedings',
    'incollection',
    'phdthesis',
    'mastersthesis',
    'techreport',
    'misc',
    'unpublished'
);

/**
 * 生成有效的引用 key
 * 格式: 字母开头，后跟字母数字下划线
 */
export const arbitraryCitationKey = fc
    .tuple(
        fc.constantFrom('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'),
        fc.string({ minLength: 0, maxLength: 20, unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789_'.split('')) })
    )
    .map(([first, rest]) => first + rest);

/**
 * 生成简单的字段值（不含特殊字符，且不是纯空格）
 */
export const arbitrarySimpleFieldValue = fc.string({
    minLength: 1,
    maxLength: 100,
    unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,.:-'.split(''))
}).filter(s => s.trim().length > 0); // 确保不是纯空格

/**
 * 生成作者名
 */
export const arbitraryAuthorName = fc
    .tuple(
        fc.string({ minLength: 1, maxLength: 1, unit: fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')) }),
        fc.string({ minLength: 2, maxLength: 10, unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')) })
    )
    .map(([first, rest]) => first + rest);

/**
 * 生成完整作者字段
 */
export const arbitraryAuthor = fc
    .array(arbitraryAuthorName, { minLength: 1, maxLength: 3 })
    .map(names => names.map(n => `${n}, ${n.charAt(0)}.`).join(' and '));

/**
 * 生成年份
 */
export const arbitraryYear = fc.integer({ min: 1900, max: 2030 }).map(String);

/**
 * 生成 BibTeX 字段
 */
export const arbitraryBibFields = fc.record({
    author: arbitraryAuthor,
    title: arbitrarySimpleFieldValue,
    year: arbitraryYear
}) as fc.Arbitrary<BibFields>;

/**
 * 生成完整的 BibEntry
 */
export const arbitraryBibEntry = fc
    .tuple(arbitraryBibType, arbitraryCitationKey, arbitraryBibFields)
    .map(([type, key, fields]): BibEntry => ({
        type,
        key,
        fields,
        rawText: `@${type}{${key}, author = {${fields.author}}, title = {${fields.title}}, year = {${fields.year}}}`,
        startLine: 0,
        endLine: 0
    }));

/**
 * 生成具有唯一 key 的 BibEntry 数组
 */
export const arbitraryUniqueBibEntries = (minLength: number, maxLength: number) =>
    fc.uniqueArray(arbitraryCitationKey, { minLength, maxLength })
        .chain(keys =>
            fc.tuple(
                ...keys.map(key =>
                    fc.tuple(arbitraryBibType, arbitraryBibFields)
                        .map(([type, fields]): BibEntry => ({
                            type,
                            key,
                            fields,
                            rawText: `@${type}{${key}, author = {${fields.author}}, title = {${fields.title}}, year = {${fields.year}}}`,
                            startLine: 0,
                            endLine: 0
                        }))
                )
            )
        );

/**
 * 生成 LaTeX 引用命令
 */
export const arbitraryCiteCommand = fc.constantFrom(
    'cite',
    'citep',
    'citet',
    'citeauthor',
    'citeyear',
    'parencite',
    'textcite',
    'autocite',
    'nocite'
);

/**
 * 生成带引用的 LaTeX 内容
 */
export const arbitraryTexContentWithCitations = (keys: string[]) =>
    fc.array(
        fc.tuple(
            arbitraryCiteCommand,
            fc.shuffledSubarray(keys, { minLength: 1, maxLength: Math.min(3, keys.length) })
        ),
        { minLength: 1, maxLength: 5 }
    ).map(citations =>
        citations.map(([cmd, ks]) => `\\${cmd}{${ks.join(',')}}`).join(' Some text ')
    );

/**
 * 生成未使用引用检测的测试数据
 */
export const arbitraryUnusedCitationTestData = fc
    .tuple(
        fc.uniqueArray(arbitraryCitationKey, { minLength: 2, maxLength: 10 }),
        fc.float({ min: 0, max: 1 })
    )
    .map(([allKeys, usageRatio]) => {
        const usedCount = Math.max(1, Math.floor(allKeys.length * usageRatio));
        const usedKeys = new Set(allKeys.slice(0, usedCount));
        const unusedKeys = allKeys.slice(usedCount);
        return { allKeys, usedKeys, unusedKeys };
    });

/**
 * 生成空白字符串
 */
export const arbitraryWhitespace = fc.string({
    minLength: 0,
    maxLength: 20,
    unit: fc.constantFrom(' ', '\t', '\n', '\r')
});
