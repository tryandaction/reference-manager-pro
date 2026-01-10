/**
 * bibParser.ts - BibTeX 解析器
 *
 * 职责：解析.bib文件内容，提取条目信息
 * 实现要点：
 * - 使用正则表达式匹配BibTeX条目
 * - 处理嵌套花括号（如 title = {A {Novel} Approach}）
 * - 支持多行字段值
 * - 保留原始文本便于替换
 *
 * 为什么不用bibtex-parser库？
 * 1. 减少依赖，降低打包体积
 * 2. 我们的需求相对简单
 * 3. 自己实现更容易定制和调试
 */

/**
 * BibTeX条目接口
 * 表示一个完整的文献条目（如@article, @book等）
 */
export interface BibEntry {
    /** 条目类型，如 "article", "book", "inproceedings" 等 */
    type: string;
    /** 引用key，如 "einstein1905"，用于 \cite{key} */
    key: string;
    /** 字段映射表，存储author, title, journal等 */
    fields: BibFields;
    /** 原始文本，包含完整的条目内容，用于替换 */
    rawText: string;
    /** 在原文件中的起始行号（从0开始） */
    startLine: number;
    /** 在原文件中的结束行号（从0开始） */
    endLine: number;
}

/**
 * BibTeX字段映射类型
 * 常见字段：author, title, journal, year, volume, pages, doi, etc.
 */
export interface BibFields {
    author?: string;
    title?: string;
    journal?: string;
    booktitle?: string;
    year?: string;
    volume?: string;
    number?: string;
    pages?: string;
    doi?: string;
    url?: string;
    publisher?: string;
    address?: string;
    edition?: string;
    month?: string;
    note?: string;
    abstract?: string;
    keywords?: string;
    /** 允许其他自定义字段 */
    [key: string]: string | undefined;
}

/**
 * 解析结果接口
 * 包含解析出的条目和可能的错误信息
 */
export interface ParseResult {
    /** 成功解析的条目列表 */
    entries: BibEntry[];
    /** 解析过程中的警告/错误信息 */
    warnings: string[];
}

/**
 * 解析完整的.bib文件内容
 *
 * @param content .bib文件的完整内容
 * @returns ParseResult 包含所有解析出的条目
 *
 * @example
 * const content = fs.readFileSync('references.bib', 'utf-8');
 * const result = parseBibFile(content);
 * console.log(`解析出 ${result.entries.length} 个条目`);
 */
export function parseBibFile(content: string): ParseResult {
    const entries: BibEntry[] = [];
    const warnings: string[] = [];

    // 正则匹配条目开始：@type{key,
    // 支持的格式：@article{key, @Article{key, @ARTICLE {key, 等
    const entryStartRegex = /@(\w+)\s*\{\s*([^,\s]+)\s*,/g;

    let match: RegExpExecArray | null;

    while ((match = entryStartRegex.exec(content)) !== null) {
        const type = match[1]!.toLowerCase(); // 转小写统一格式
        const key = match[2]!;
        const startIndex = match.index;

        // 计算起始行号
        const startLine = content.substring(0, startIndex).split('\n').length - 1;

        // 找到匹配的结束花括号
        const endIndex = findMatchingBrace(content, match.index + match[0].length - 1);

        if (endIndex === -1) {
            warnings.push(`警告: 条目 "${key}" 的花括号不匹配，跳过`);
            continue;
        }

        // 提取原始文本
        const rawText = content.substring(startIndex, endIndex + 1);

        // 计算结束行号
        const endLine = content.substring(0, endIndex).split('\n').length - 1;

        // 解析字段
        const fieldsText = content.substring(
            match.index + match[0].length,
            endIndex
        );
        const fields = parseFields(fieldsText);

        entries.push({
            type,
            key,
            fields,
            rawText,
            startLine,
            endLine,
        });
    }

    return { entries, warnings };
}

/**
 * 找到与指定位置左花括号匹配的右花括号
 *
 * @param content 完整内容
 * @param startPos 左花括号的位置
 * @returns 匹配的右花括号位置，找不到返回-1
 */
function findMatchingBrace(content: string, startPos: number): number {
    let depth = 1; // 当前嵌套深度
    let pos = startPos + 1;

    while (pos < content.length && depth > 0) {
        const char = content[pos];

        // 跳过转义字符
        if (char === '\\' && pos + 1 < content.length) {
            pos += 2;
            continue;
        }

        if (char === '{') {
            depth++;
        } else if (char === '}') {
            depth--;
        }

        pos++;
    }

    return depth === 0 ? pos - 1 : -1;
}

/**
 * 解析字段文本，提取所有字段键值对
 *
 * @param fieldsText 字段部分的文本（不含外层花括号）
 * @returns BibFields 字段映射表
 */
function parseFields(fieldsText: string): BibFields {
    const fields: BibFields = {};

    // 匹配字段：fieldName = {value} 或 fieldName = "value" 或 fieldName = number
    // 使用更宽松的正则，然后逐个处理
    const fieldRegex = /(\w+)\s*=\s*/g;

    let fieldMatch: RegExpExecArray | null;
    const fieldPositions: Array<{ name: string; valueStart: number }> = [];

    // 第一遍：找到所有字段名和值的起始位置
    while ((fieldMatch = fieldRegex.exec(fieldsText)) !== null) {
        fieldPositions.push({
            name: fieldMatch[1]!.toLowerCase(),
            valueStart: fieldMatch.index + fieldMatch[0].length,
        });
    }

    // 第二遍：提取每个字段的值
    for (let i = 0; i < fieldPositions.length; i++) {
        const current = fieldPositions[i]!;
        const nextPos = fieldPositions[i + 1];
        const nextStart = nextPos
            ? nextPos.valueStart - nextPos.name.length - 3 // 回退到逗号位置
            : fieldsText.length;

        // 提取值文本
        const valueText = fieldsText.substring(current.valueStart, nextStart).trim();
        const value = extractFieldValue(valueText);

        if (value !== null) {
            fields[current.name] = value;
        }
    }

    return fields;
}

/**
 * 提取字段值
 * 处理三种格式：{value}, "value", number
 *
 * @param valueText 值文本（可能包含尾部的逗号）
 * @returns 清理后的值，或null（如果无法解析）
 */
function extractFieldValue(valueText: string): string | null {
    // 去掉尾部逗号和空白
    let text = valueText.replace(/,\s*$/, '').trim();

    if (text.length === 0) {
        return null;
    }

    // 情况1：花括号包裹 {value}
    if (text.startsWith('{')) {
        const endBrace = findMatchingBrace('{' + text.substring(1), 0);
        if (endBrace !== -1) {
            // 提取花括号内的内容
            const innerValue = text.substring(1, endBrace);
            return cleanFieldValue(innerValue);
        }
    }

    // 情况2：双引号包裹 "value"
    if (text.startsWith('"')) {
        const endQuote = text.indexOf('"', 1);
        if (endQuote !== -1) {
            return cleanFieldValue(text.substring(1, endQuote));
        }
    }

    // 情况3：纯数字或简单文本
    // 去掉可能的逗号和空白
    text = text.replace(/[,}\s]+$/, '');
    if (text.length > 0) {
        return cleanFieldValue(text);
    }

    return null;
}

/**
 * 清理字段值
 * - 合并多行为单行
 * - 去除多余空白
 * - 保留有意义的空格
 *
 * @param value 原始值
 * @returns 清理后的值
 */
function cleanFieldValue(value: string): string {
    return value
        // 将换行替换为空格
        .replace(/\n/g, ' ')
        // 将多个空白字符替换为单个空格
        .replace(/\s+/g, ' ')
        // 去除首尾空白
        .trim();
}

/**
 * 解析单个BibTeX条目文本
 *
 * @param text 单个条目的完整文本
 * @returns BibEntry | null 解析结果
 *
 * @example
 * const entry = parseSingleEntry('@article{key, author = {John}, title = {Paper}}');
 */
export function parseSingleEntry(text: string): BibEntry | null {
    const result = parseBibFile(text);
    return result.entries.length > 0 ? result.entries[0] ?? null : null;
}

/**
 * 将BibEntry对象序列化为BibTeX格式文本
 *
 * @param entry 要序列化的条目
 * @param indent 缩进字符串，默认为两个空格
 * @returns 格式化的BibTeX文本
 *
 * @example
 * const formatted = serializeBibEntry(entry);
 * // 输出:
 * // @article{einstein1905,
 * //   author = {Einstein, Albert},
 * //   title = {On the Electrodynamics of Moving Bodies},
 * //   year = {1905}
 * // }
 */
export function serializeBibEntry(entry: BibEntry, indent: string = '  '): string {
    const lines: string[] = [];

    // 第一行：类型和key
    lines.push(`@${entry.type}{${entry.key},`);

    // 字段按照推荐顺序排列
    const fieldOrder = [
        'author', 'title', 'journal', 'booktitle', 'year',
        'volume', 'number', 'pages', 'doi', 'url',
        'publisher', 'address', 'month', 'note', 'abstract'
    ];

    // 收集所有字段
    const allFields = new Set([
        ...fieldOrder,
        ...Object.keys(entry.fields)
    ]);

    // 按顺序输出字段
    const outputFields: string[] = [];
    for (const fieldName of allFields) {
        const value = entry.fields[fieldName];
        if (value !== undefined && value !== '') {
            outputFields.push(`${indent}${fieldName} = {${value}}`);
        }
    }

    // 添加字段行，用逗号分隔
    lines.push(outputFields.join(',\n'));

    // 结束花括号
    lines.push('}');

    return lines.join('\n');
}

/**
 * 从多个条目中提取所有引用key
 *
 * @param entries BibEntry数组
 * @returns key数组
 */
export function extractKeysFromEntries(entries: BibEntry[]): string[] {
    return entries.map(entry => entry.key);
}

/**
 * 在条目列表中查找指定key的条目
 *
 * @param entries 条目列表
 * @param key 要查找的key
 * @returns 找到的条目或undefined
 */
export function findEntryByKey(entries: BibEntry[], key: string): BibEntry | undefined {
    return entries.find(entry => entry.key === key);
}

/**
 * 获取条目的简短描述（用于显示）
 *
 * @param entry BibTeX条目
 * @returns 格式如 "Einstein, Albert - On the Electrodynamics..."
 */
export function getEntryDescription(entry: BibEntry): string {
    const author = entry.fields.author ?? 'Unknown author';
    const title = entry.fields.title ?? 'Untitled';

    // 截断过长的标题
    const maxTitleLength = 50;
    const truncatedTitle = title.length > maxTitleLength
        ? title.substring(0, maxTitleLength) + '...'
        : title;

    return `${author} - "${truncatedTitle}"`;
}
